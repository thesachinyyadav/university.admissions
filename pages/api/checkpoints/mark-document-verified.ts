import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { applicationNumber, staffId } = req.body;

    if (!applicationNumber || !staffId) {
      return res.status(400).json({
        message: 'Application number and staff ID are required',
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

    // Check if applicant has arrived
    if (applicant.status !== 'ARRIVED') {
      return res.status(400).json({
        message: `Cannot verify documents. Current status: ${applicant.status}`,
      });
    }

    // Update applicant status to DOCUMENT_VERIFIED
    const { error: updateError } = await supabaseAdmin
      .from('applicants')
      .update({
        status: 'DOCUMENT_VERIFIED',
        document_verified_at: new Date().toISOString(),
      })
      .eq('application_number', applicationNumber);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        message: 'Failed to update applicant status',
      });
    }

    // Trigger SMS notification about verification completion
    try {
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms/send-verification-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: applicant.phone,
          name: applicant.name,
        }),
      });

      const smsData = await smsResponse.json();

      if (!smsResponse.ok) {
        console.error('Verification SMS failed:', smsData);
      }
    } catch (smsError) {
      console.error('Verification SMS error:', smsError);
    }

    // Insert checkpoint log
    const { error: checkpointError } = await supabaseAdmin
      .from('checkpoints')
      .insert({
        application_number: applicationNumber,
        checkpoint_type: 'DOCUMENT_VERIFICATION',
        user_id: staffId,
        timestamp: new Date().toISOString(),
        metadata: {
          staff_id: staffId,
          previous_status: 'ARRIVED',
          new_status: 'DOCUMENT_VERIFIED',
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
      message: 'Documents verified successfully',
      applicant: updatedApplicant,
    });
  } catch (error) {
    console.error('Document verification error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
