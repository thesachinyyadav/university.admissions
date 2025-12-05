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
    const { data: panels, error } = await supabaseAdmin
      .from('panels')
      .select('panel_login, is_active, assigned_floor_id, floors(floor_name)')
      .eq('is_active', true)
      .order('panel_login', { ascending: true });

    if (error) {
      console.log('Active panels fetch error:', { message: error.message, code: error.code });
      return res.status(200).json({ panels: [] }); // Return empty array instead of error
    }

    return res.status(200).json({ panels: panels || [] });
  } catch (error: any) {
    console.log('Active panels API error:', { message: error?.message || 'Unknown error' });
    return res.status(200).json({ panels: [] }); // Return empty array instead of error
  }
}
