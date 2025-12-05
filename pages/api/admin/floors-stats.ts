import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch all floors with their assigned programs
    const { data: floors, error: floorsError } = await supabaseAdmin
      .from('floors')
      .select('*')
      .order('floor_number', { ascending: true });

    if (floorsError) {
      console.error('Floors fetch error:', floorsError);
      return res.status(500).json({
        message: 'Failed to fetch floors',
      });
    }

    // Fetch all applicants
    const { data: applicants, error: applicantsError } = await supabaseAdmin
      .from('applicants')
      .select('program, status');

    if (applicantsError) {
      console.error('Applicants fetch error:', applicantsError);
      return res.status(500).json({
        message: 'Failed to fetch applicants',
      });
    }

    // Calculate statistics for each floor
    const floorsWithStats = floors?.map((floor) => {
      const assignedPrograms = floor.assigned_programs || [];
      const floorApplicants = applicants?.filter((a) =>
        assignedPrograms.includes(a.program)
      ) || [];

      return {
        floor_name: floor.floor_name,
        floor_number: floor.floor_number,
        assigned_programs: assignedPrograms,
        arrived_count: floorApplicants.filter(
          (a) =>
            a.status === 'ARRIVED' ||
            a.status === 'DOCUMENT_VERIFIED' ||
            a.status === 'INTERVIEW_IN_PROGRESS' ||
            a.status === 'INTERVIEW_COMPLETED'
        ).length,
        verified_count: floorApplicants.filter(
          (a) =>
            a.status === 'DOCUMENT_VERIFIED' ||
            a.status === 'INTERVIEW_IN_PROGRESS' ||
            a.status === 'INTERVIEW_COMPLETED'
        ).length,
        completed_count: floorApplicants.filter(
          (a) => a.status === 'INTERVIEW_COMPLETED'
        ).length,
      };
    }) || [];

    return res.status(200).json({ floors: floorsWithStats });
  } catch (error) {
    console.error('Floors stats API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
