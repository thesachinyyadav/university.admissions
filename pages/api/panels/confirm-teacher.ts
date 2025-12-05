import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { randomUUID } from 'crypto';

interface ConfirmBody {
  panel: number;
  teacherId: string;
  deviceId?: string;
  sessionToken?: string;
}

interface ConfirmResponse {
  sessionToken: string;
  panel: number;
  teacher: {
    id: string;
    name: string;
    email: string | null;
    lastConfirmedAt: string;
  };
  pair: Array<{
    id: string;
    name: string;
    email: string | null;
    lastConfirmedAt: string | null;
    isSelf: boolean;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfirmResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { panel, teacherId, deviceId, sessionToken }: ConfirmBody = req.body;

    if (!panel || !teacherId) {
      return res.status(400).json({ message: 'Panel number and teacher are required' });
    }

    if (!Number.isInteger(panel) || panel <= 0) {
      return res.status(400).json({ message: 'Panel number must be a positive integer' });
    }

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('teacher_id, name, email, panel, panel_session_token, panel_last_confirmed_at')
      .eq('teacher_id', teacherId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.panel !== panel) {
      return res.status(403).json({ message: 'Teacher is not assigned to this panel' });
    }

    const nowIso = new Date().toISOString();
    let newToken = teacher.panel_session_token;

    if (teacher.panel_session_token && sessionToken) {
      if (sessionToken !== teacher.panel_session_token) {
        return res.status(401).json({ message: 'Session token mismatch. Please relogin.' });
      }
    } else {
      newToken = randomUUID();
    }

    const { error: updateError } = await supabaseAdmin
      .from('teachers')
      .update({
        panel_session_token: newToken,
        panel_device_id: deviceId ?? null,
        panel_last_confirmed_at: nowIso,
      })
      .eq('teacher_id', teacherId);

    if (updateError) {
      console.error('[confirm teacher] update error:', updateError);
      return res.status(500).json({ message: 'Failed to update teacher session' });
    }

    const { data: pair, error: pairError } = await supabaseAdmin
      .from('teachers')
      .select('teacher_id, name, email, panel_last_confirmed_at, panel_session_token')
      .eq('panel', panel)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (pairError) {
      console.error('[confirm teacher] pair fetch error:', pairError);
      return res.status(500).json({ message: pairError.message || 'Failed to fetch panel teachers' });
    }

    return res.status(200).json({
      sessionToken: newToken!,
      panel,
      teacher: {
        id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email ?? null,
        lastConfirmedAt: nowIso,
      },
      pair: (pair || []).map((partner) => ({
        id: partner.teacher_id,
        name: partner.name,
        email: partner.email ?? null,
        lastConfirmedAt: partner.panel_last_confirmed_at,
        isSelf: partner.teacher_id === teacher.teacher_id,
      })),
    });
  } catch (error) {
    console.error('[confirm teacher] unexpected error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
