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
    const { panel_login, password, teacher_name_1, teacher_name_2, assigned_floor_id } = req.body;

    if (!panel_login || !password || !teacher_name_1 || !teacher_name_2 || !assigned_floor_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if panel login already exists
    const { data: existing } = await supabaseAdmin
      .from('panels')
      .select('panel_id')
      .eq('panel_login', panel_login)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Panel login already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create panel
    const { data: panel, error } = await supabaseAdmin
      .from('panels')
      .insert({
        panel_login,
        panel_password_hash: hashedPassword,
        teacher_name_1,
        teacher_name_2,
        assigned_floor_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Panel creation error:', error);
      return res.status(500).json({ message: 'Failed to create panel' });
    }

    return res.status(200).json({ message: 'Panel created successfully', panel });
  } catch (error) {
    console.error('Create panel API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
