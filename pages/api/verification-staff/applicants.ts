import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';

const relevantStatuses = ['ARRIVED', 'DOCUMENT_VERIFIED', 'INTERVIEW_IN_PROGRESS', 'INTERVIEW_COMPLETED'];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const parseQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

async function countByStatus(status: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('applicants')
    .select('application_number', { count: 'exact', head: true })
    .eq('status', status);

  if (error) {
    console.error(`Count fetch error for status ${status}:`, error);
    return 0;
  }

  return typeof count === 'number' ? count : 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const pageParam = parseQueryValue(req.query.page) || '1';
    const pageSizeParam = parseQueryValue(req.query.pageSize) || String(DEFAULT_PAGE_SIZE);
    const searchTermRaw = parseQueryValue(req.query.search) || '';

    const page = clampNumber(parseInt(pageParam, 10) || 1, 1, 1000);
    const pageSize = clampNumber(parseInt(pageSizeParam, 10) || DEFAULT_PAGE_SIZE, 10, MAX_PAGE_SIZE);
    const searchTerm = searchTermRaw.trim().toUpperCase();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let arrivalsQuery = supabaseAdmin
      .from('applicants')
      .select('*', { count: 'exact' })
      .eq('status', 'ARRIVED')
      .order('arrived_at', { ascending: true });

    if (searchTerm) {
      arrivalsQuery = arrivalsQuery.ilike('application_number', `${searchTerm}%`);
    }

    arrivalsQuery = arrivalsQuery.range(from, to);

    const { data: arrivalRows, error: arrivalError, count: arrivalMatches } = await arrivalsQuery;

    if (arrivalError) {
      console.error('Arrivals fetch error:', arrivalError);
      return res.status(500).json({ message: 'Failed to fetch arrived applicants' });
    }

    const [totalArrivedCount, documentVerifiedCount, interviewInProgressCount, interviewCompletedCount] =
      await Promise.all([
        countByStatus('ARRIVED'),
        countByStatus('DOCUMENT_VERIFIED'),
        countByStatus('INTERVIEW_IN_PROGRESS'),
        countByStatus('INTERVIEW_COMPLETED'),
      ]);

    const statusBreakdown = {
      ARRIVED: totalArrivedCount,
      DOCUMENT_VERIFIED: documentVerifiedCount,
      INTERVIEW_IN_PROGRESS: interviewInProgressCount,
      INTERVIEW_COMPLETED: interviewCompletedCount,
    } as Record<string, number>;

    const totalVerified = documentVerifiedCount + interviewInProgressCount + interviewCompletedCount;

    const stats = {
      total_arrived: totalArrivedCount,
      total_verified: totalVerified,
      pending_verification: totalArrivedCount,
      arrived_count: totalArrivedCount,
      status_breakdown: statusBreakdown,
    };

    const totalMatches = typeof arrivalMatches === 'number' ? arrivalMatches : (arrivalRows?.length || 0);
    const totalPages = Math.max(Math.ceil(totalMatches / pageSize), 1);

    return res.status(200).json({
      applicants: arrivalRows || [],
      stats,
      pagination: {
        page,
        pageSize,
        total: totalMatches,
        totalPages,
        search: searchTerm,
      },
    });
  } catch (error) {
    console.error('Verification staff API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
