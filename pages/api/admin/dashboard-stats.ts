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
    // Get all applicants to calculate statistics
    const { data: applicants, error } = await supabaseAdmin
      .from('applicants')
      .select('status');

    if (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({
        message: 'Failed to fetch statistics',
      });
    }

    const stats = {
      total_registered: applicants?.length || 0,
      total_arrived:
        applicants?.filter(
          (a) =>
            a.status === 'ARRIVED' ||
            a.status === 'DOCUMENT_VERIFIED' ||
            a.status === 'INTERVIEW_IN_PROGRESS' ||
            a.status === 'INTERVIEW_COMPLETED'
        ).length || 0,
      total_verified:
        applicants?.filter(
          (a) =>
            a.status === 'DOCUMENT_VERIFIED' ||
            a.status === 'INTERVIEW_IN_PROGRESS' ||
            a.status === 'INTERVIEW_COMPLETED'
        ).length || 0,
      total_in_progress:
        applicants?.filter((a) => a.status === 'INTERVIEW_IN_PROGRESS').length || 0,
      total_completed:
        applicants?.filter((a) => a.status === 'INTERVIEW_COMPLETED').length || 0,
      pending_arrival:
        applicants?.filter((a) => a.status === 'REGISTERED' || !a.status).length || 0,
      pending_verification:
        applicants?.filter((a) => a.status === 'ARRIVED').length || 0,
      pending_interview:
        applicants?.filter((a) => a.status === 'DOCUMENT_VERIFIED').length || 0,
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
