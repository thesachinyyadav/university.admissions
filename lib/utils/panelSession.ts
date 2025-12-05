import { supabaseAdmin } from '@/lib/supabaseClient';

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface PanelSessionValidation {
  panel: number;
  sessionToken: string;
}

export interface PanelTeacherSession {
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  panel: number;
  lastConfirmedAt: string | null;
}

export async function validatePanelSession({
  panel,
  sessionToken,
}: PanelSessionValidation): Promise<PanelTeacherSession | null> {
  if (!sessionToken) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('teachers')
    .select('teacher_id, name, email, panel, panel_last_confirmed_at')
    .eq('panel_session_token', sessionToken)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.panel !== panel) {
    return null;
  }

  if (!data.panel_last_confirmed_at) {
    return null;
  }

  const lastConfirmed = new Date(data.panel_last_confirmed_at).getTime();
  if (Number.isNaN(lastConfirmed)) {
    return null;
  }

  if (Date.now() - lastConfirmed > SESSION_TTL_MS) {
    return null;
  }

  return {
    teacherId: data.teacher_id,
    teacherName: data.name,
    teacherEmail: data.email ?? null,
    panel: data.panel,
    lastConfirmedAt: data.panel_last_confirmed_at,
  };
}
