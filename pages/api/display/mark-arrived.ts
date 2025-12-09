import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';

type SuccessResponse = {
  success: true;
  alreadyProcessed: boolean;
  applicant: {
    applicationNumber: string;
    name: string;
    program: string;
    location?: string | null;
    instructions?: string | null;
    status: string;
    arrivedAt?: string | null;
  };
};

type ErrorResponse = {
  success: false;
  error: string;
  details?: string;
};

const DISPLAY_USER_ID = 'display-board';

const extractApplicationNumber = (rawValue: unknown) => {
  if (!rawValue) {
    return '';
  }

  const stringValue = String(rawValue).trim();
  if (!stringValue) {
    return '';
  }

  const queryMatch = stringValue.match(/application(?:Number|_number|No)?=([A-Za-z0-9-]+)/i);
  if (queryMatch) {
    return queryMatch[1];
  }

  return stringValue;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { applicationNumber: rawApplicationNumber, code } = req.body || {};
    const applicationNumber = extractApplicationNumber(rawApplicationNumber ?? code);

    if (!applicationNumber) {
      return res.status(400).json({
        success: false,
        error: 'Application number missing',
        details: 'Scanner input did not include a valid application number.',
      });
    }

    const { data: applicant, error: fetchError } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('application_number', applicationNumber)
      .single();

    if (fetchError || !applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found',
        details: 'No applicant exists with this application number.',
      });
    }

    const isAlreadyProcessed = applicant.status !== 'REGISTERED';
    let arrivedAt = applicant.arrived_at ?? null;
    let currentStatus = applicant.status;

    if (!isAlreadyProcessed) {
      const timestamp = new Date().toISOString();

      const { error: updateError } = await supabaseAdmin
        .from('applicants')
        .update({
          status: 'ARRIVED',
          arrived_at: timestamp,
          updated_at: timestamp,
        })
        .eq('application_number', applicationNumber)
        .eq('status', 'REGISTERED');

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update applicant status',
          details: updateError.message,
        });
      }

      arrivedAt = timestamp;
      currentStatus = 'ARRIVED';

      const { error: checkpointError } = await supabaseAdmin
        .from('checkpoints')
        .insert({
          application_number: applicationNumber,
          checkpoint_type: 'ARRIVAL',
          user_id: DISPLAY_USER_ID,
          metadata: {
            source: 'display-board',
            location: applicant.location,
            program: applicant.program,
          },
        });

      if (checkpointError) {
        console.error('[display-board] checkpoint insert failed', checkpointError);
      }
    }

    return res.status(200).json({
      success: true,
      alreadyProcessed: isAlreadyProcessed,
      applicant: {
        applicationNumber,
        name: applicant.name,
        program: applicant.program,
        location: applicant.location,
        instructions: applicant.instructions,
        status: currentStatus,
        arrivedAt,
      },
    });
  } catch (error: any) {
    console.error('[display-board] arrival handler error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error?.message,
    });
  }
}
