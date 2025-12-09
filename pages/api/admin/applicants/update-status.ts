import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { application_number, status } = req.body;

    if (!application_number || !status) {
      return res.status(400).json({ message: 'Application number and status are required' });
    }

    const validStatuses = [
      'REGISTERED',
      'ARRIVED',
      'DOCUMENT_VERIFIED',
      'INTERVIEW_IN_PROGRESS',
      'INTERVIEW_COMPLETED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updateData: any = { status };

    if (status === 'ARRIVED') {
      updateData.arrived_at = new Date().toISOString();
    } else if (status === 'DOCUMENT_VERIFIED') {
      updateData.document_verified_at = new Date().toISOString();
    } else if (status === 'INTERVIEW_COMPLETED') {
      updateData.interviewed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('applicants')
      .update(updateData)
      .eq('application_number', application_number);

    if (error) {
      console.error('Status update error:', error);
      return res.status(500).json({ message: 'Failed to update status' });
    }

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
