import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import {
  Button,
  Card,
  StatsCard,
  Badge,
  QuickActionCard,
  Skeleton
} from '../components/ui';

interface DashboardStats {
  total_registered?: number;
  total_arrived?: number;
  total_verified?: number;
  total_in_progress?: number;
  total_completed?: number;
  pending_arrival?: number;
  pending_verification?: number;
  pending_interview?: number;
}

interface FloorStats {
  floor_name: string;
  floor_number: number;
  assigned_programs: string[];
  arrived_count: number;
  verified_count: number;
  completed_count: number;
}

const STATS_REFRESH_MS = 5000;
const FLOORS_REFRESH_MS = 10000;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MasterAdmin() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Real-time statistics with SWR
  const { data: statsData, isValidating: isStatsValidating } = useSWR(
    user ? '/api/admin/dashboard-stats' : null,
    fetcher,
    {
      refreshInterval: STATS_REFRESH_MS,
      revalidateOnFocus: true,
    }
  );

  const { data: floorsData, isValidating: isFloorsValidating } = useSWR(
    user ? '/api/admin/floors-stats' : null,
    fetcher,
    {
      refreshInterval: FLOORS_REFRESH_MS,
    }
  );

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'master_admin') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  if (!user) {
    return null;
  }

  const stats: DashboardStats = statsData?.stats || {};
  const floors: FloorStats[] = floorsData?.floors || [];

  const {
    total_registered = 0,
    total_arrived = 0,
    total_verified = 0,
    total_in_progress = 0,
    total_completed = 0,
    pending_arrival = 0,
    pending_verification = 0,
    pending_interview = 0,
  } = stats;

  const formatNumber = (value: number) => value.toLocaleString('en-IN');
  const safePercent = (numerator: number, denominator: number) =>
    denominator ? Math.round((numerator / denominator) * 100) : 0;

  const arrivalRate = safePercent(total_arrived, total_registered);
  const verificationRate = safePercent(total_verified, total_registered);
  const completionRate = safePercent(total_completed, total_registered);

  const showStatsSkeleton = !statsData && isStatsValidating;
  const showFloorsSkeleton = !floorsData && isFloorsValidating;

  const statCards = [
    {
      title: 'Registered',
      value: formatNumber(total_registered),
      change: total_in_progress ? `${formatNumber(total_in_progress)} in interview` : undefined,
      trend: total_in_progress ? 'up' as const : undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'Arrived',
      value: formatNumber(total_arrived),
      change: total_registered ? `${arrivalRate}% of registered` : undefined,
      trend: total_registered ? 'up' as const : undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Verified',
      value: formatNumber(total_verified),
      change: total_registered ? `${verificationRate}% of registered` : undefined,
      trend: total_registered ? 'up' as const : undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Completed',
      value: formatNumber(total_completed),
      change: total_registered ? `${completionRate}% of registered` : undefined,
      trend: total_registered ? 'up' as const : undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  const pipelineSummary = [
    {
      label: 'Awaiting arrival',
      value: pending_arrival,
      badgeTone: 'border-red-200 bg-red-50 text-red-700',
      description: 'Registered applicants who still need to check in.',
    },
    {
      label: 'Awaiting verification',
      value: pending_verification,
      badgeTone: 'border-amber-200 bg-amber-50 text-amber-700',
      description: 'Arrived applicants pending document screening.',
    },
    {
      label: 'Queued for interview',
      value: pending_interview,
      badgeTone: 'border-sky-200 bg-sky-50 text-sky-700',
      description: 'Verified candidates waiting to join a panel.',
    },
    {
      label: 'Interviews in progress',
      value: total_in_progress,
      badgeTone: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      description: 'Panels currently interviewing candidates.',
    },
  ];

  const quickActions = [
    {
      title: 'Import applicants',
      description: 'Sync Excel data to keep the dashboard current.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      action: () => router.push('/master-admin/import-data'),
    },
    {
      title: 'Manage panels',
      description: 'Assign faculty pairs and keep interview rooms staffed.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => router.push('/master-admin/panels'),
    },
    {
      title: 'Configure floors',
      description: 'Map programmes to floors and manage lobby flow.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      action: () => router.push('/master-admin/floors'),
    },
    {
      title: 'View applicants',
      description: 'Search and filter every applicant in one place.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      action: () => router.push('/master-admin/applicants'),
    },
    {
      title: 'Manage teachers',
      description: 'Keep your panel teacher roster up to date.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => router.push('/master-admin/teachers'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-10 space-y-10"
      >
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Master admin</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admissions control centre</h1>
            <p className="text-gray-600 max-w-xl">
              Monitor live admission metrics, unlock tools quickly, and keep every floor running smoothly.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <Button variant="secondary" onClick={() => router.push('/master-admin/applicants')}>
              View applicants
            </Button>
            <Button onClick={() => router.push('/master-admin/panels')}>
              Manage panels
            </Button>
          </div>
        </header>

        <Card variant="bordered" className="shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {showStatsSkeleton
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="card border border-gray-100 shadow-none">
                    <div className="space-y-3">
                      <Skeleton width="45%" />
                      <Skeleton variant="rectangular" height={48} />
                      <Skeleton width="60%" />
                    </div>
                  </div>
                ))
              : statCards.map(({ title, value, change, trend, icon }) => (
                  <StatsCard
                    key={title}
                    title={title}
                    value={value}
                    change={change}
                    trend={trend}
                    icon={icon}
                  />
                ))}
          </div>
        </Card>

        <Card
          title="Pipeline health"
          subtitle="Track outstanding steps so no applicant is left waiting."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pipelineSummary.map((item) => (
              <div key={item.label} className="card shadow-none border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">{item.label}</h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${item.badgeTone}`}>
                    Live
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(item.value)}</p>
                <p className="mt-2 text-xs text-gray-500 leading-snug">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Floor coverage"
          subtitle="Live arrival, verification, and completion counts per floor."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-xs">
                  <th className="px-4 sm:px-6 py-3">Floor</th>
                  <th className="px-4 sm:px-6 py-3">Programmes</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Arrived</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Verified</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {showFloorsSkeleton
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        {Array.from({ length: 5 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-4 sm:px-6 py-4">
                            <Skeleton />
                          </td>
                        ))}
                      </tr>
                    ))
                  : floors.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                          No floor data yet. Add floors and assign programmes to see live distribution.
                        </td>
                      </tr>
                    )
                    : floors.map((floor) => (
                        <tr key={`${floor.floor_number}-${floor.floor_name}`} className="transition-colors hover:bg-gray-50/70">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="font-semibold text-gray-900">{floor.floor_name}</div>
                            <p className="text-xs text-gray-500 mt-1">Level {floor.floor_number}</p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            {floor.assigned_programs?.length ? (
                              <div className="flex flex-wrap gap-1.5">
                                {floor.assigned_programs.map((programme) => (
                                  <Badge key={programme} variant="info" size="sm">{programme}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center font-semibold text-blue-600">
                            {formatNumber(floor.arrived_count)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center font-semibold text-green-600">
                            {formatNumber(floor.verified_count)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center font-semibold text-purple-600">
                            {formatNumber(floor.completed_count)}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Quick tools"
          subtitle="Jump straight into the screens you revisit most."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.title}
                title={action.title}
                description={action.description}
                icon={action.icon}
                onClick={action.action}
              />
            ))}
          </div>
        </Card>
      </motion.main>
    </div>
  );
}
