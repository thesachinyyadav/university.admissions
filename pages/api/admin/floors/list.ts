import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { data: floors, error } = await supabaseAdmin
      .from('floors')
      .select('floor_id, floor_name, floor_number')
      .eq('is_active', true)
      .order('floor_number', { ascending: true });

    if (error) {
      console.error('Floors fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch floors' });
    }

    return res.status(200).json({ floors: floors || [] });
  } catch (error) {
    console.error('List floors API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
