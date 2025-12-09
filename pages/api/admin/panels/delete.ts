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
    const { panel_id } = req.body;

    if (!panel_id) {
      return res.status(400).json({ message: 'Panel ID is required' });
    }

    const { error } = await supabaseAdmin
      .from('panels')
      .delete()
      .eq('panel_id', panel_id);

    if (error) {
      console.error('Panel delete error:', error);
      return res.status(500).json({ message: 'Failed to delete panel' });
    }

    return res.status(200).json({ message: 'Panel deleted successfully' });
  } catch (error) {
    console.error('Delete panel API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
