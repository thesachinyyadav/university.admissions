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
    const { floor_id, floor_name, floor_number, assigned_programs, description } = req.body;

    if (!floor_id || !floor_name || !floor_number || !assigned_programs) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const { error } = await supabaseAdmin
      .from('floors')
      .update({
        floor_name,
        floor_number,
        assigned_programs,
        description: description || null,
      })
      .eq('floor_id', floor_id);

    if (error) {
      console.error('Floor update error:', error);
      return res.status(500).json({ message: 'Failed to update floor' });
    }

    return res.status(200).json({ message: 'Floor updated successfully' });
  } catch (error) {
    console.error('Update floor API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
