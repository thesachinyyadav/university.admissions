import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { sanitizePhoneNumber } from '../../../lib/utils/formatting';

interface ApplicantInput {
  application_number: string;
  name: string;
  phone: string;
  program: string;
  campus: string;
  date: string;
  time: string;
  location: string;
  instructions: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { applicants } = req.body as { applicants: ApplicantInput[] };

    if (!applicants || !Array.isArray(applicants) || applicants.length === 0) {
      return res.status(400).json({ message: 'Applicants array is required' });
    }

    const successfulInserts: string[] = [];
    const errors: Array<{ application_number: string; error: string }> = [];

    for (const applicant of applicants) {
      try {
        // Validate required fields
        if (!applicant.application_number || !applicant.name || !applicant.phone || 
            !applicant.program || !applicant.date || !applicant.time) {
          errors.push({
            application_number: applicant.application_number || 'unknown',
            error: 'Missing required fields',
          });
          continue;
        }

        // Check if application number already exists
        const { data: existing } = await supabaseAdmin
          .from('applicants')
          .select('application_number')
          .eq('application_number', applicant.application_number)
          .single();

        if (existing) {
          errors.push({
            application_number: applicant.application_number,
            error: 'Application number already exists',
          });
          continue;
        }

        // Sanitize phone number
        const sanitizedPhone = sanitizePhoneNumber(applicant.phone);
        if (!sanitizedPhone || sanitizedPhone.length < 10) {
          errors.push({
            application_number: applicant.application_number,
            error: 'Invalid phone number format',
          });
          continue;
        }

        // Insert applicant
        const { error: insertError } = await supabaseAdmin
          .from('applicants')
          .insert({
            application_number: applicant.application_number,
            name: applicant.name,
            phone: sanitizedPhone,
            program: applicant.program,
            campus: applicant.campus || null,
            date: applicant.date,
            time: applicant.time,
            location: applicant.location || null,
            instructions: applicant.instructions || null,
            status: 'REGISTERED',
          });

        if (insertError) {
          errors.push({
            application_number: applicant.application_number,
            error: insertError.message,
          });
        } else {
          successfulInserts.push(applicant.application_number);
        }
      } catch (error: any) {
        errors.push({
          application_number: applicant.application_number || 'unknown',
          error: error.message || 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      success: successfulInserts.length,
      errors: errors,
      message: `Imported ${successfulInserts.length} out of ${applicants.length} applicants`,
    });
  } catch (error: any) {
    console.error('Import applicants API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
