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
    const { floor_name, floor_number, assigned_programs, description } = req.body;

    if (!floor_name || !floor_number || !assigned_programs) {
      return res.status(400).json({ message: 'Floor name, number, and programs are required' });
    }

    const { data: floor, error } = await supabaseAdmin
      .from('floors')
      .insert({
        floor_name,
        floor_number,
        assigned_programs,
        description: description || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Floor creation error:', error);
      return res.status(500).json({ message: 'Failed to create floor' });
    }

    return res.status(200).json({ message: 'Floor created successfully', floor });
  } catch (error) {
    console.error('Create floor API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
