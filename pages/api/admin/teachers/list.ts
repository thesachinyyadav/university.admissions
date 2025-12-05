import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { data: teachers, error } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Teachers fetch error:', error);
        return res.status(500).json({ message: 'Failed to fetch teachers' });
      }

      return res.status(200).json({ teachers: teachers || [] });
    } catch (error) {
      console.error('List teachers API error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, department, specialization } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Teacher name is required' });
      }

      const { data: teacher, error } = await supabaseAdmin
        .from('teachers')
        .insert({
          name,
          email: email || null,
          department: department || null,
          specialization: specialization || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Teacher creation error:', error);
        return res.status(500).json({ message: 'Failed to create teacher' });
      }

      return res.status(200).json({ message: 'Teacher created successfully', teacher });
    } catch (error) {
      console.error('Create teacher API error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
