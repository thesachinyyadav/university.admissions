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
    const { page = '1', limit = '50', search, status, program, dateFrom, dateTo } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('applicants')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`application_number.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (program) {
      query = query.ilike('program', `%${program}%`);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data: applicants, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Applicants list error:', error);
      return res.status(500).json({ message: 'Failed to fetch applicants' });
    }

    return res.status(200).json({
      applicants: applicants || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('List applicants API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
