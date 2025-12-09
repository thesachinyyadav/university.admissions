import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { panel_id, password, teacher_name_1, teacher_name_2, assigned_floor_id } = req.body;

    if (!panel_id || !teacher_name_1 || !teacher_name_2 || !assigned_floor_id) {
      return res.status(400).json({ message: 'All fields except password are required' });
    }

    const updateData: any = {
      teacher_name_1,
      teacher_name_2,
      assigned_floor_id,
    };

    // Only update password if provided
    if (password) {
      updateData.panel_password_hash = await bcrypt.hash(password, 10);
    }

    const { error } = await supabaseAdmin
      .from('panels')
      .update(updateData)
      .eq('panel_id', panel_id);

    if (error) {
      console.error('Panel update error:', error);
      return res.status(500).json({ message: 'Failed to update panel' });
    }

    return res.status(200).json({ message: 'Panel updated successfully' });
  } catch (error) {
    console.error('Update panel API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
