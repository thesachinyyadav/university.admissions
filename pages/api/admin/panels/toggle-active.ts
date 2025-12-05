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
    const { panel_id, is_active } = req.body;

    if (!panel_id || typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'Panel ID and status are required' });
    }

    const { error } = await supabaseAdmin
      .from('panels')
      .update({ is_active })
      .eq('panel_id', panel_id);

    if (error) {
      console.error('Toggle active error:', error);
      return res.status(500).json({ message: 'Failed to update panel status' });
    }

    return res.status(200).json({ message: 'Panel status updated successfully' });
  } catch (error) {
    console.error('Toggle active API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
