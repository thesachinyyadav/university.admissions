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
    const { panel } = req.query;

    if (!panel || typeof panel !== 'string') {
      return res.status(400).json({
        message: 'Panel number is required',
      });
    }

    const panelNumber = Number(panel);

    if (!Number.isInteger(panelNumber) || panelNumber <= 0) {
      return res.status(400).json({
        message: 'Panel number must be a positive integer',
      });
    }

    // Get today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count interviews completed by this panel today
    const { data: checkpoints, error } = await supabaseAdmin
      .from('checkpoints')
      .select('application_number')
      .eq('checkpoint_type', 'INTERVIEW_COMPLETED')
      .eq('panel_number', panelNumber)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());

    if (error) {
      console.error('Completed count error:', error);
      return res.status(500).json({
        message: 'Failed to fetch completed count',
      });
    }

    return res.status(200).json({
      count: checkpoints?.length || 0,
    });
  } catch (error) {
    console.error('Completed count API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
