import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { applicationNumber, volunteerId } = req.body;

    if (!applicationNumber) {
      return res.status(400).json({ error: 'Application number is required' });
    }

    // Fetch applicant details
    const { data: applicant, error: fetchError } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('application_number', applicationNumber)
      .single();

    if (fetchError || !applicant) {
      console.error('Applicant not found:', fetchError);
      return res.status(404).json({ 
        error: 'Applicant not found',
        details: 'No applicant exists with this application number'
      });
    }

    // Check if already arrived
    if (applicant.status === 'ARRIVED' || applicant.status === 'VERIFIED_AND_ASSESSED' || applicant.status === 'INTERVIEW_IN_PROGRESS' || applicant.status === 'INTERVIEW_COMPLETED') {
      return res.status(400).json({
        error: 'Already processed',
        details: `This applicant has already been marked as ${applicant.status}`,
        applicant: {
          name: applicant.name,
          program: applicant.program,
          status: applicant.status,
          arrivedAt: applicant.arrived_at
        }
      });
    }

    const now = new Date().toISOString();

    // Update applicant status to ARRIVED
    const { error: updateError } = await supabaseAdmin
      .from('applicants')
      .update({
        status: 'ARRIVED',
        arrived_at: now,
        updated_at: now
      })
      .eq('application_number', applicationNumber);

    if (updateError) {
      console.error('Failed to update applicant:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update applicant status',
        details: updateError.message
      });
    }

    // Log checkpoint
    const { error: checkpointError } = await supabaseAdmin
      .from('checkpoints')
      .insert({
        application_number: applicationNumber,
        checkpoint_type: 'ARRIVAL',
        volunteer_id: volunteerId,
        timestamp: now,
        metadata: {
          location: applicant.location,
          program: applicant.program
        }
      });

    if (checkpointError) {
      console.error('Failed to log checkpoint:', checkpointError);
      // Don't fail the request, just log the error
    }

    // Trigger SMS notification
    try {
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms/send-arrival-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: applicant.phone,
          name: applicant.name,
          program: applicant.program,
          instructions: applicant.instructions
        })
      });

      const smsData = await smsResponse.json();
      
      if (!smsResponse.ok) {
        console.error('SMS failed:', smsData);
        // Don't fail the request if SMS fails
      }
    } catch (smsError: any) {
      console.error('SMS error:', smsError);
      // Don't fail the request if SMS fails
    }

    return res.status(200).json({
      success: true,
      message: 'Applicant marked as arrived successfully',
      applicant: {
        applicationNumber: applicant.application_number,
        name: applicant.name,
        phone: applicant.phone,
        program: applicant.program,
        campus: applicant.campus,
        date: applicant.date,
        time: applicant.time,
        location: applicant.location,
        instructions: applicant.instructions,
        status: 'ARRIVED',
        arrivedAt: now
      }
    });

  } catch (error: any) {
    console.error('Error in mark-arrived:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
