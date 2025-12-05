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
    const { data: panels, error } = await supabaseAdmin
      .from('panels')
      .select(`
        *,
        floors (
          floor_name
        )
      `)
      .order('panel_login', { ascending: true });

    if (error) {
      console.error('Panels fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch panels' });
    }

    const formattedPanels = panels?.map((panel) => ({
      panel_id: panel.panel_id,
      panel_login: panel.panel_login,
      teacher_name_1: panel.teacher_name_1,
      teacher_name_2: panel.teacher_name_2,
      assigned_floor_id: panel.assigned_floor_id,
      floor_name: panel.floors?.floor_name || 'N/A',
      is_active: panel.is_active,
    })) || [];

    return res.status(200).json({ panels: formattedPanels });
  } catch (error) {
    console.error('List panels API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
