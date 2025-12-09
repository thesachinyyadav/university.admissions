import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';

interface PanelTeacherResponse {
  panel: number;
  teachers: Array<{
    id: string;
    name: string;
    email: string | null;
    lastConfirmedAt: string | null;
    hasActiveSession: boolean;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PanelTeacherResponse | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    .select('teacher_id, name, email, panel_last_confirmed_at, panel_session_token')
    .eq('panel', panelNumber)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('[panel teachers] DB error:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch panel teachers' });
  }

  return res.status(200).json({
    panel: panelNumber,
    teachers: (data || []).map((teacher) => ({
      id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email ?? null,
      lastConfirmedAt: teacher.panel_last_confirmed_at,
      hasActiveSession: Boolean(teacher.panel_session_token),
    })),
  });
}
