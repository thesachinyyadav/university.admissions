import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';

interface TeacherSearchResult {
  id: string;
  name: string;
  email: string | null;
  panel: number | null;
}

interface SearchTeachersResponse {
  teachers: TeacherSearchResult[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchTeachersResponse | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query, limit } = req.query;
  const searchTerm = typeof query === 'string' ? query.trim() : '';

  if (!searchTerm || searchTerm.length < 2) {
    return res.status(400).json({ message: 'Please provide at least 2 characters to search' });
  }

  const maxResults = Math.min(Number(limit) || 10, 25);

  try {
    const escaped = searchTerm.replace(/[%_]/g, (char) => `\\${char}`);
    const likePattern = `%${escaped}%`;

    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select('teacher_id, name, email, panel, is_active')
      .or(`name.ilike.${likePattern},email.ilike.${likePattern}`)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(maxResults);

    if (error) {
      console.error('[search teachers] DB error:', error);
      return res.status(500).json({ message: 'Failed to search teachers' });
    }

    const teachers = (data || []).map((teacher) => ({
        id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email ?? null,
        panel: teacher.panel ?? null,
      }));

    return res.status(200).json({ teachers });
  } catch (error) {
    console.error('[search teachers] unexpected error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
