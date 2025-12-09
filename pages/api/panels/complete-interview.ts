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

    // Check if interview is in progress
    if (applicant.status !== 'INTERVIEW_IN_PROGRESS') {
      return res.status(400).json({
        message: `Cannot complete interview. Current status: ${applicant.status}`,
      });
    }

    const { data: panelTeachers, error: panelTeachersError } = await supabaseAdmin
      .from('teachers')
      .select('email')
      .eq('panel', panel)
      .eq('is_active', true);

    if (panelTeachersError) {
      console.error('[complete interview] panel teacher fetch error:', panelTeachersError);
    }

    const emailSet = new Set<string>();
    if (session.teacherEmail) {
      emailSet.add(session.teacherEmail);
    }

    (panelTeachers || [])
      .map((teacher) => teacher.email)
      .filter((email): email is string => Boolean(email))
      .forEach((email) => emailSet.add(email));

    const interviewedByEmails = emailSet.size > 0 ? Array.from(emailSet).join(', ') : null;

    // Update applicant status to INTERVIEW_COMPLETED
    const { error: updateError } = await supabaseAdmin
      .from('applicants')
      .update({
        status: 'INTERVIEW_COMPLETED',
        interviewed_at: new Date().toISOString(),
        interviewed_by_emails: interviewedByEmails,
      })
      .eq('application_number', applicationNumber);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        message: 'Failed to complete interview',
      });
    }

    // Insert checkpoint log
    const { error: checkpointError } = await supabaseAdmin
      .from('checkpoints')
      .insert({
        application_number: applicationNumber,
        checkpoint_type: 'INTERVIEW_COMPLETED',
        panel_id: null,
        panel_number: panel,
        timestamp: new Date().toISOString(),
        metadata: {
          panel_number: panel,
          previous_status: 'INTERVIEW_IN_PROGRESS',
          new_status: 'INTERVIEW_COMPLETED',
          completed_at: new Date().toISOString(),
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
      message: 'Interview completed successfully',
      applicant: updatedApplicant,
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
