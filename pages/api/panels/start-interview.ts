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

    if (!applicationNumber || !panel || !sessionToken) {
      return res.status(400).json({
        message: 'Application number, panel number, and session token are required',
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

    // Fetch the applicant
    const { data: applicant, error: fetchError } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('application_number', applicationNumber)
      .single();

    if (fetchError || !applicant) {
      return res.status(404).json({
        message: 'Applicant not found',
      });
    }

    // Check if documents are verified
    if (applicant.status !== 'DOCUMENT_VERIFIED') {
      return res.status(400).json({
        message: `Cannot start interview. Current status: ${applicant.status}`,
      });
    }

    // Update applicant status to INTERVIEW_IN_PROGRESS
    const { error: updateError } = await supabaseAdmin
      .from('applicants')
      .update({
        status: 'INTERVIEW_IN_PROGRESS',
        interviewed_by_emails: null,
      })
      .eq('application_number', applicationNumber);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        message: 'Failed to start interview',
      });
    }

    // Insert checkpoint log
    const { error: checkpointError } = await supabaseAdmin
      .from('checkpoints')
      .insert({
        application_number: applicationNumber,
        checkpoint_type: 'INTERVIEW_STARTED',
        panel_id: null,
        panel_number: panel,
        timestamp: new Date().toISOString(),
        metadata: {
          panel_number: panel,
          previous_status: 'DOCUMENT_VERIFIED',
          new_status: 'INTERVIEW_IN_PROGRESS',
          confirmed_by: session.teacherName,
        },
      });

    if (checkpointError) {
      console.error('Checkpoint log error:', checkpointError);
      // Don't fail the request if checkpoint log fails
    }

    // Fetch updated applicant data
    const { data: updatedApplicant } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('application_number', applicationNumber)
      .single();

    return res.status(200).json({
      message: 'Interview started successfully',
      applicant: updatedApplicant,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
