import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { validatePanelSession } from '@/lib/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { applicationNumber, panel, sessionToken } = req.body as {
      applicationNumber?: string;
      panel?: number;
      sessionToken?: string;
    };

    if (!applicationNumber) {
      return res.status(400).json({
        message: 'Application number is required',
      });
    }

    if (!panel || !sessionToken) {
      return res.status(400).json({
        message: 'Panel number and session token are required',
      });
    }

    if (!Number.isInteger(panel) || panel <= 0) {
      return res.status(400).json({
        message: 'Panel number must be a positive integer',
      });
    }

    const session = await validatePanelSession({ panel, sessionToken });

    if (!session) {
      return res.status(401).json({
        message: 'Session expired or invalid. Please reconfirm your identity.',
      });
    }

    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('application_number', applicationNumber)
      .single();

    if (applicantError || !applicant) {
      return res.status(404).json({
        message: 'Applicant not found',
      });
    }

    // Check if applicant is in the correct status
    if (
      applicant.status !== 'DOCUMENT_VERIFIED' &&
      applicant.status !== 'INTERVIEW_IN_PROGRESS'
    ) {
      return res.status(400).json({
        message: `Candidate is not ready for interview. Current status: ${applicant.status}`,
      });
    }

    return res.status(200).json({ applicant });
  } catch (error) {
    console.error('Search applicant API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
