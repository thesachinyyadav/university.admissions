import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';

interface AssignTeacherResponse {
  success: true;
  teacher: {
    id: string;
    name: string;
    email: string | null;
    panel: number | null;
  };
  clearedTeacherIds: string[];
  movedFromPanel: number | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssignTeacherResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { panel, teacherId, removeTeacherId } = req.body as {
      panel?: number;
      teacherId?: string;
      removeTeacherId?: string | null;
    };

    if (!panel || !Number.isInteger(panel) || panel <= 0) {
      return res.status(400).json({ message: 'A valid panel number is required' });
    }

    if (!teacherId || typeof teacherId !== 'string') {
      return res.status(400).json({ message: 'A valid teacher ID is required' });
    }

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('teacher_id, name, email, panel, is_active')
      .eq('teacher_id', teacherId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!teacher.is_active) {
      return res.status(400).json({ message: 'Teacher is not active' });
    }

    const previousPanel = typeof teacher.panel === 'number' ? teacher.panel : null;
    let clearedTeacherIds: string[] = [];

    const { data: currentPanelTeachers, error: currentPanelError } = await supabaseAdmin
      .from('teachers')
      .select('teacher_id')
      .eq('panel', panel);

    if (currentPanelError) {
      console.error('[assign teacher] current panel lookup error:', currentPanelError);
      return res.status(500).json({ message: 'Failed to load current panel teachers' });
    }

    const currentIds = (currentPanelTeachers ?? []).map((item) => item.teacher_id);
    const otherTeacherIds = currentIds.filter((id) => id !== teacherId);
    const isAlreadyAssigned = currentIds.includes(teacherId);
    const MAX_PANEL_SIZE = 2;
    const requiresRemoval = !isAlreadyAssigned && currentIds.length >= MAX_PANEL_SIZE;

    if (removeTeacherId) {
      if (typeof removeTeacherId !== 'string') {
        return res.status(400).json({ message: 'Invalid remove teacher identifier' });
      }

      if (removeTeacherId === teacherId) {
        return res.status(400).json({ message: 'Cannot remove the same teacher being assigned' });
      }

      if (!otherTeacherIds.includes(removeTeacherId)) {
        return res.status(400).json({ message: 'Selected teacher is not assigned to this panel' });
      }

      const { error: clearError } = await supabaseAdmin
        .from('teachers')
        .update({
          panel: null,
          panel_session_token: null,
          panel_device_id: null,
          panel_last_confirmed_at: null,
        })
        .eq('teacher_id', removeTeacherId);

      if (clearError) {
        console.error('[assign teacher] explicit clear error:', clearError);
        return res.status(500).json({ message: 'Failed to unassign selected teacher' });
      }

      clearedTeacherIds = [removeTeacherId];
    } else if (requiresRemoval) {
      return res.status(409).json({
        message: 'Panel already has assigned teachers. Please choose who to remove before proceeding.',
      });
    }

    const { data: updatedTeacher, error: updateError } = await supabaseAdmin
      .from('teachers')
      .update({
        panel,
        panel_session_token: null,
        panel_device_id: null,
        panel_last_confirmed_at: null,
      })
      .eq('teacher_id', teacherId)
      .select('teacher_id, name, email, panel')
      .single();

    if (updateError || !updatedTeacher) {
      console.error('[assign teacher] update error:', updateError);
      return res.status(500).json({ message: 'Failed to assign teacher to panel' });
    }

    return res.status(200).json({
      success: true,
      teacher: {
        id: updatedTeacher.teacher_id,
        name: updatedTeacher.name,
        email: updatedTeacher.email ?? null,
        panel: updatedTeacher.panel ?? null,
      },
      clearedTeacherIds,
      movedFromPanel: previousPanel !== panel ? previousPanel : null,
    });
  } catch (error) {
    console.error('[assign teacher] unexpected error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
