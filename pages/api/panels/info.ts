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

    if (!panel || Array.isArray(panel)) {
      return res.status(400).json({ message: 'Panel number is required' });
    }

    const panelNumber = Number(panel);

    if (!Number.isInteger(panelNumber) || panelNumber <= 0) {
      return res.status(400).json({ message: 'Panel number must be a positive integer' });
    }

    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select('teacher_id, name, email, panel_last_confirmed_at')
      .eq('panel', panelNumber)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[panel info] DB error:', error);
      return res.status(500).json({ message: 'Failed to fetch panel data' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No teachers assigned to this panel yet' });
    }

    return res.status(200).json({
      panel: {
        panel_number: panelNumber,
        teacher_count: data.length,
        teachers: data.map((teacher) => ({
          id: teacher.teacher_id,
          name: teacher.name,
          email: teacher.email,
          lastConfirmedAt: teacher.panel_last_confirmed_at,
        })),
      },
    });
  } catch (error) {
    console.error('Panel info API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
