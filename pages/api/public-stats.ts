import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // 1. Candidates count (Total for now, as "today" might be empty in demo data)
    // If you want strictly today: .eq('date', today)
    const { count: candidatesCount, error: candidatesError } = await supabaseAdmin
      .from('applicants')
      .select('*', { count: 'exact', head: true });

    if (candidatesError) throw candidatesError;

    // 2. Campuses (Distinct count)
    const { data: campusesData, error: campusesError } = await supabaseAdmin
      .from('applicants')
      .select('campus');
      
    if (campusesError) throw campusesError;
    
    const uniqueCampuses = new Set(campusesData?.map(a => a.campus).filter(Boolean));

    // 3. Active Panels
    const { count: panelsCount, error: panelsError } = await supabaseAdmin
      .from('panels')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (panelsError) throw panelsError;

    return res.status(200).json({
      candidates: candidatesCount || 0,
      campuses: uniqueCampuses.size || 0,
      panels: panelsCount || 0
    });

  } catch (error) {
    console.error('Public stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
}
