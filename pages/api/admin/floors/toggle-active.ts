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
    const { floor_id, is_active } = req.body;

    if (!floor_id || typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'Floor ID and status are required' });
    }

    const { error } = await supabaseAdmin
      .from('floors')
      .update({ is_active })
      .eq('floor_id', floor_id);

    if (error) {
      console.error('Toggle active error:', error);
      return res.status(500).json({ message: 'Failed to update floor status' });
    }

    return res.status(200).json({ message: 'Floor status updated successfully' });
  } catch (error) {
    console.error('Toggle floor active API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
