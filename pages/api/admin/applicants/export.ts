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
    const { search, status, program, dateFrom, dateTo } = req.query;

    let query = supabaseAdmin.from('applicants').select('*');

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

    const { data: applicants, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Applicants export error:', error);
      return res.status(500).json({ message: 'Failed to export applicants' });
    }

    return res.status(200).json({ applicants: applicants || [] });
  } catch (error) {
    console.error('Export applicants API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
