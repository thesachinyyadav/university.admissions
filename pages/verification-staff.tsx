import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Modal } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';

interface Applicant {
  application_number: string;
  name: string;
  phone: string;
  program: string;
  campus: string;
  date: string;
  time: string;
  location: string;
  instructions: string;
  status: string;
  arrived_at: string | null;
  document_verified_at: string | null;
  skill_assessed_at: string | null;
  interviewed_at: string | null;
  interviewed_by_emails?: string | null;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const PAGE_SIZE = 10;

export default function VerificationStaff() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const staffId = user?.userId ?? user?.id ?? user?.user_id ?? user?.staffId;

  const apiKey = useMemo(() => {
    if (!staffId) {
      return null;
    }

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    params.set('staffId', String(staffId));

    return `/api/verification-staff/applicants?${params.toString()}`;
  }, [staffId, page, debouncedSearch]);

  // SWR for real-time applicant list
  const { data: applicantsData, error, mutate } = useSWR(
    apiKey,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
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
    if (parsedUser.role !== 'verification_staff') {
      router.push('/login');
      return;
    }

    const resolvedStaffId = parsedUser.userId ?? parsedUser.id ?? parsedUser.user_id ?? parsedUser.staffId;
    setUser({
      ...parsedUser,
      userId: resolvedStaffId,
    });
  }, [router]);

  useEffect(() => {
    // Auto-hide notifications
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toUpperCase());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isModalOpen) {
        scanInputRef.current?.focus();
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [isModalOpen, page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scanInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const applicants: Applicant[] = applicantsData?.applicants || [];
  const stats = applicantsData?.stats || {
    total_arrived: 0,
    total_verified: 0,
    pending_verification: 0,
    arrived_count: 0,
    status_breakdown: {
      ARRIVED: 0,
      DOCUMENT_VERIFIED: 0,
      INTERVIEW_IN_PROGRESS: 0,
      INTERVIEW_COMPLETED: 0,
    },
  };
  const pagination = applicantsData?.pagination;

  const totalVerifiedCount = stats.total_verified || 0;
  const totalArrivedCount = stats.arrived_count || stats.total_arrived || 0;
  const totalPipeline = totalArrivedCount + totalVerifiedCount;
  const totalPending = stats.pending_verification ?? totalArrivedCount;
  const totalMatches = pagination?.total ?? applicants.length;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? page;
  const pageSize = pagination?.pageSize ?? PAGE_SIZE;
  const hasSearch = !!debouncedSearch;
  const rangeStart = applicants.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = applicants.length > 0 ? rangeStart + applicants.length - 1 : 0;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(Math.max(pagination.totalPages, 1));
    }
  }, [pagination, page]);

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'ARRIVED':
        return { label: 'Awaiting Verification', className: 'bg-yellow-100 text-yellow-700' };
      case 'DOCUMENT_VERIFIED':
        return { label: 'Verified', className: 'bg-green-100 text-green-700' };
      case 'INTERVIEW_IN_PROGRESS':
        return { label: 'Interview In Progress', className: 'bg-blue-100 text-blue-700' };
      case 'INTERVIEW_COMPLETED':
        return { label: 'Interview Completed', className: 'bg-purple-100 text-purple-700' };
      default:
        return { label: status.replace(/_/g, ' ').toLowerCase(), className: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleVerify = async (applicant: Applicant) => {
    if (applicant.status !== 'ARRIVED') {
      setNotification({
        type: 'error',
        message: 'Only arrivals awaiting verification can be processed.',
      });
      return;
    }

    if (!staffId) {
      setNotification({
        type: 'error',
        message: 'Session expired. Please log in again.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkpoints/mark-document-verified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationNumber: applicant.application_number,
          staffId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: `Documents verified and interview SMS triggered for ${applicant.name}`,
        });
        mutate(); // Refresh the list
        setSelectedApplicant(null);
        setIsModalOpen(false);
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to verify documents',
        });
      }
    } catch (error) {
      console.error('Error verifying documents:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanSubmit = async () => {
    const trimmedValue = scanValue.trim();
    const normalizedForLookup = trimmedValue.toUpperCase();

    if (!trimmedValue) {
      setScanError('Scan a valid application number.');
      scanInputRef.current?.focus();
      return;
    }

    if (!staffId) {
      setNotification({
        type: 'error',
        message: 'Session expired. Please log in again.',
      });
      return;
    }

    setScanProcessing(true);
    setScanError(null);

    const matchingApplicant = applicants.find(
      (applicant) => applicant.application_number.toUpperCase() === normalizedForLookup
    );

    try {
      const response = await fetch('/api/checkpoints/mark-document-verified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationNumber: trimmedValue,
          staffId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const subject = matchingApplicant?.name || trimmedValue;
        setNotification({
          type: 'success',
          message: `Documents verified and interview SMS triggered for ${subject}`,
        });
        setScanValue('');
        mutate();
      } else {
        const errorMessage = data.message || 'Failed to verify scanned applicant';
        setScanError(errorMessage);
        setNotification({
          type: 'error',
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error verifying scanned applicant:', error);
      const fallback = 'Network error. Please try again.';
      setScanError(fallback);
      setNotification({
        type: 'error',
        message: fallback,
      });
    } finally {
      setScanProcessing(false);
      scanInputRef.current?.focus();
    }
  };

  const openApplicantDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50"
          >
            <div
              className={`px-6 py-4 rounded-lg shadow-lg ${
                notification.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                {notification.type === 'success' ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto w-full max-w-6xl px-3 pb-10 pt-6 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Verification Control Center</h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Scan, verify, and keep the verification queue moving smoothly across devices.
            </p>
          </div>
          <div className="rounded-full bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 shadow-sm sm:text-sm">
            Live refresh every 5 seconds
          </div>
        </div>

        {/* Barcode Scanner */}
        <div className="mb-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Quick Barcode Verification</h2>
                <p className="text-sm text-gray-600">
                  Keep the field focused, scan the applicant barcode, and we will mark them verified + notify instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setScanValue('');
                  setScanError(null);
                  scanInputRef.current?.focus();
                }}
                className="hidden rounded-full border border-primary-200 px-4 py-2 text-xs font-medium text-primary-700 hover:bg-primary-50 sm:inline-flex"
              >
                Reset Scanner Field
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanSubmit();
              }}
              className="mt-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    ref={scanInputRef}
                    type="text"
                    inputMode="text"
                    value={scanValue}
                    onChange={(e) => {
                      setScanValue(e.target.value);
                      if (scanError) {
                        setScanError(null);
                      }
                    }}
                    placeholder="Scan or type the application number"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900 shadow-inner focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                    autoComplete="off"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Scanner Ready
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={scanProcessing}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-primary-700 hover:to-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {scanProcessing ? 'Verifying…' : 'Verify & Notify'}
                </button>
              </div>
            </form>
            {scanError && (
              <p className="mt-3 text-sm text-red-600">
                {scanError}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setScanValue('');
                setScanError(null);
                scanInputRef.current?.focus();
              }}
              className="mt-3 inline-flex rounded-full border border-primary-200 px-4 py-2 text-xs font-medium text-primary-700 hover:bg-primary-50 sm:hidden"
            >
              Reset Scanner Field
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-5 text-white shadow-md sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                  Total Candidates Tracked
                </p>
                <p className="text-3xl font-bold sm:text-4xl">{totalPipeline}</p>
                <p className="text-[11px] font-medium text-blue-100 sm:text-xs">
                  Arrived: {totalArrivedCount} • Verified: {totalVerifiedCount}
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-3">
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-5 text-white shadow-md sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
                  Documents Verified
                </p>
                <p className="text-3xl font-bold sm:text-4xl">{totalVerifiedCount}</p>
              </div>
              <div className="rounded-xl bg-white/20 p-3">
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-5 text-white shadow-md sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">
                  Awaiting Verification
                </p>
                <p className="text-3xl font-bold sm:text-4xl">{totalPending}</p>
              </div>
              <div className="rounded-xl bg-white/20 p-3">
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setDebouncedSearch(searchQuery.trim().toUpperCase());
                  setPage(1);
                }
              }}
              placeholder="Search by Application Number..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Applicants List */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-gray-100 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">Arrived Candidates</h2>
              <p className="text-xs text-primary-100 sm:text-sm">
                {rangeStart > 0
                  ? `Showing ${rangeStart}–${rangeEnd} of ${totalMatches} ${hasSearch ? 'matches' : 'arrivals'}`
                  : hasSearch
                    ? 'No matches found for the current search.'
                    : 'No arrivals waiting right now.'}
              </p>
              <p className="text-[11px] text-primary-100 sm:text-xs">
                Tap a card for full profile • Swipe the list on mobile for quick actions
              </p>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium sm:text-sm">
              {totalPending} awaiting verification
            </span>
          </div>

          {error && (
            <div className="p-6 text-center text-red-600">
              Failed to load applicants. Please refresh the page.
            </div>
          )}

          {!error && applicants.length === 0 && (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 text-lg">
                {hasSearch
                  ? `No candidates found matching "${debouncedSearch}"`
                  : 'No arrived candidates yet'}
              </p>
            </div>
          )}

          {!error && applicants.length > 0 && (
            <div className="divide-y divide-gray-100">
              {applicants.map((applicant) => {
                const statusMeta = getStatusMeta(applicant.status);

                return (
                  <motion.div
                    key={applicant.application_number}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="cursor-pointer bg-white px-4 py-5 transition hover:bg-gray-50 sm:px-6"
                    onClick={() => openApplicantDetails(applicant)}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                            {applicant.name}
                          </h3>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm sm:text-sm">
                            {applicant.application_number}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            <span className="font-medium text-gray-800">{applicant.program}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="font-medium text-gray-800">{applicant.campus}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-medium text-gray-800">
                              Arrived: {applicant.arrived_at ? formatTime(applicant.arrived_at) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerify(applicant);
                        }}
                        disabled={isProcessing || applicant.status !== 'ARRIVED'}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 md:ml-4"
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="h-5 w-5 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>Processing...</span>
                          </span>
                        ) : applicant.status === 'ARRIVED' ? (
                          'Verify & Notify'
                        ) : (
                          statusMeta.label
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-6">
            <span className="text-sm text-gray-600">
              {rangeStart > 0
                ? `Showing ${rangeStart}-${rangeEnd} of ${totalMatches} ${hasSearch ? 'matches' : 'arrivals'}`
                : 'No records on this page. Adjust filters or pagination to continue.'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canGoPrev && setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!canGoPrev}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => canGoNext && setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={!canGoNext}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Applicant Details Modal */}
      {isModalOpen && selectedApplicant && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApplicant(null);
          }}
          title="Candidate Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Application Number</p>
                <p className="font-medium text-gray-800">
                  {selectedApplicant.application_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-800">{selectedApplicant.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{selectedApplicant.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium text-gray-800">{selectedApplicant.program}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Campus</p>
                <p className="font-medium text-gray-800">{selectedApplicant.campus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-800">
                  {formatDate(selectedApplicant.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Slot</p>
                <p className="font-medium text-gray-800">{selectedApplicant.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-800">{selectedApplicant.location}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Instructions</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-lg">
                {selectedApplicant.instructions || 'No special instructions provided.'}
              </p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Arrival Status</span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusMeta(selectedApplicant.status).className}`}
                >
                  {getStatusMeta(selectedApplicant.status).label}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Arrived at: {selectedApplicant.arrived_at ? formatTime(selectedApplicant.arrived_at) : 'N/A'}
              </p>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => handleVerify(selectedApplicant)}
                disabled={isProcessing || selectedApplicant.status !== 'ARRIVED'}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isProcessing
                  ? 'Processing...'
                  : selectedApplicant.status === 'ARRIVED'
                    ? 'Verify & Notify'
                    : getStatusMeta(selectedApplicant.status).label}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedApplicant(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
