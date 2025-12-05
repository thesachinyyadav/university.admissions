import type { FormEvent } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui';

type Notification = {
  type: 'success' | 'error';
  message: string;
  detail?: string;
};

type ArrivalApplicant = {
  applicationNumber: string;
  name: string;
  phone: string;
  program: string;
  campus?: string;
  date?: string;
  time?: string;
  location?: string;
  instructions?: string;
  status?: string;
  arrivedAt?: string;
};

type ScanHistoryItem = {
  timestamp: Date;
  success: boolean;
  applicationNumber: string;
  applicant?: ArrivalApplicant;
  error?: string;
};

type ScanMetrics = {
  total: number;
  successes: number;
  successRate: number;
  uniqueApplicants: number;
  lastSuccess: ScanHistoryItem | null;
};

type ScanMode = 'camera' | 'barcode';

const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/30 p-6 text-sm text-white/60">
      Initializing scanner...
    </div>
  ),
});

const VolunteerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [manualAppNumber, setManualAppNumber] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ArrivalApplicant | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      router.replace('/login?role=volunteer');
      setAuthChecked(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'volunteer') {
        router.replace('/login?role=volunteer');
        setAuthChecked(true);
        return;
      }
      const resolvedVolunteerId = parsed.userId ?? parsed.id ?? parsed.user_id ?? parsed.volunteerId;
      const normalizedUser = {
        ...parsed,
        userId: resolvedVolunteerId,
      };
      setUser(normalizedUser);
    } catch (error) {
      console.error('Failed to parse user from storage:', error);
      localStorage.removeItem('user');
      router.replace('/login?role=volunteer');
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (scanMode === 'barcode') {
      barcodeInputRef.current?.focus();
    }
  }, [scanMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const extractApplicationNumber = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return '';
    }

    const queryMatch = trimmed.match(/application(?:Number|_number|No)?=([A-Za-z0-9-]+)/i);
    if (queryMatch) {
      return queryMatch[1];
    }

    return trimmed;
  };

  const humanizeStatus = (status?: string) => {
    if (!status) {
      return '';
    }

    const map: Record<string, string> = {
      ARRIVED: 'Already checked in at arrivals',
      VERIFIED_AND_ASSESSED: 'Verified and assessed',
      INTERVIEW_IN_PROGRESS: 'Interview in progress',
      INTERVIEW_COMPLETED: 'Interview completed',
    };

    return map[status] || status.replace(/[_-]/g, ' ').toLowerCase().replace(/^(\w)/, (c) => c.toUpperCase());
  };

  const processArrival = async (input: string) => {
    if (isScanning) {
      return false;
    }

    const applicationNumber = extractApplicationNumber(input);

    if (!applicationNumber) {
      setNotification({
        type: 'error',
        message: 'Invalid application number',
        detail: 'Double-check the code or try manual entry.',
      });
      setScanError('Invalid application number. Double-check the badge and try again.');
      return false;
    }

    const volunteerId = user?.userId ?? user?.id ?? user?.user_id;

    if (!volunteerId) {
      setNotification({
        type: 'error',
        message: 'Session expired',
        detail: 'Please log in again to continue scanning.',
      });
      setScanError('Session expired. Please log in again to continue scanning.');
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setNotification({
        type: 'error',
        message: 'You are offline',
        detail: 'Reconnect to sync scans with the server.',
      });
      setScanError('You are offline. Reconnect to sync scans with the server.');
      setScanHistory((prev) => [
        {
          timestamp: new Date(),
          success: false,
          applicationNumber,
          error: 'You are offline. Reconnect to sync scans with the server.',
        },
        ...prev,
      ].slice(0, 20));
      return false;
    }

    setIsScanning(true);

    try {
      const response = await fetch('/api/checkpoints/mark-arrived', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationNumber,
          volunteerId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error || 'Unable to mark arrival.';
        const detail = payload?.details || '';
        let displayMessage = message;
        let displayDetail = detail;

        if (payload?.error === 'Already processed') {
          const applicantName = payload?.applicant?.name || applicationNumber;
          const statusNote = humanizeStatus(payload?.applicant?.status);
          const arrivedAt = payload?.applicant?.arrivedAt
            ? new Date(payload.applicant.arrivedAt).toLocaleTimeString()
            : '';

          displayMessage = `${applicantName} already checked in`;
          displayDetail = [statusNote, arrivedAt ? `Last arrival at ${arrivedAt}` : '']
            .filter(Boolean)
            .join(' • ');
        }

        setNotification({
          type: 'error',
          message: displayMessage,
          detail: displayDetail || undefined,
        });
        setScanError(displayDetail ? `${displayMessage}. ${displayDetail}` : displayMessage);
        setScanHistory((prev) => [
          {
            timestamp: new Date(),
            success: false,
            applicationNumber,
            error: displayDetail ? `${displayMessage} • ${displayDetail}` : displayMessage,
          },
          ...prev,
        ].slice(0, 20));
        return false;
      }

      const applicant: ArrivalApplicant = {
        applicationNumber,
        ...payload?.applicant,
      };

      setNotification({
        type: 'success',
        message: `Checked-in ${applicant.name || applicationNumber}.`,
        detail: 'Arrival confirmed and instructions dispatched.',
      });
      setScanError(null);

      setSelectedApplicant(applicant);

      setScanHistory((prev) => [
        {
          timestamp: new Date(),
          success: true,
          applicationNumber,
          applicant,
        },
        ...prev,
      ].slice(0, 20));

      return true;
    } catch (error) {
      console.error('Arrival processing failed:', error);
      setNotification({
        type: 'error',
        message: 'Network error while marking arrival.',
        detail: 'Check your connection and try again.',
      });
      setScanError('Network error while marking arrival. Check your connection and try again.');
      setScanHistory((prev) => [
        {
          timestamp: new Date(),
          success: false,
          applicationNumber,
          error: 'Network error while marking arrival. Check your connection and try again.',
        },
        ...prev,
      ].slice(0, 20));
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  const handleScan = (value: string) => {
    void processArrival(value);
  };

  const handleManualEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await processArrival(manualAppNumber);
    if (success) {
      setManualAppNumber('');
    }
  };

  const handleBarcodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await processArrival(barcodeInput);
    if (success) {
      setBarcodeInput('');
    }
  };

  const scanMetrics = useMemo<ScanMetrics>(() => {
    if (scanHistory.length === 0) {
      return {
        total: 0,
        successes: 0,
        successRate: 0,
        uniqueApplicants: 0,
        lastSuccess: null,
      };
    }

    const total = scanHistory.length;
    const successes = scanHistory.filter((item) => item.success).length;
    const uniqueApplicants = new Set(
      scanHistory
        .filter((item) => item.success)
        .map((item) => item.applicationNumber)
    ).size;
    const lastSuccess = scanHistory.find((item) => item.success) ?? null;
    const successRate = Math.round((successes / total) * 100);

    return {
      total,
      successes,
      successRate,
      uniqueApplicants,
      lastSuccess,
    };
  }, [scanHistory]);

  if (!authChecked) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <main className="flex min-h-screen flex-col bg-slate-950 text-white">
        <header className="relative isolate overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-black pb-12 pt-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-2xl shadow-blue-900/40 backdrop-blur"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-blue-200">Primary Check-In</p>
                  <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Scan Visitors</h1>
                  <p className="mt-1 max-w-xl text-xs text-blue-100 sm:text-sm">
                    Camera stays active for quick scans. Switch to barcode when a handheld reader is connected.
                  </p>
                  {!isOnline && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-950/50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-100">
                      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-300" />
                      Offline mode — scans queue until connection returns
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex items-center rounded-full bg-blue-900/40 p-1 text-xs font-semibold text-blue-100">
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('camera');
                        setBarcodeInput('');
                        setScanError(null);
                      }}
                      className={`rounded-full px-3 py-1 transition ${
                        scanMode === 'camera'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                          : 'text-blue-100 hover:text-white'
                      }`}
                    >
                      Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('barcode');
                        setBarcodeInput('');
                        setScanError(null);
                      }}
                      className={`rounded-full px-3 py-1 transition ${
                        scanMode === 'barcode'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                          : 'text-blue-100 hover:text-white'
                      }`}
                    >
                      Barcode
                    </button>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      isScanning ? 'bg-blue-500/20 text-blue-100' : 'bg-amber-400/40 text-amber-100'
                    }`}
                  >
                    {isScanning ? 'Processing' : 'Ready'}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {scanMode === 'camera' ? (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-3 sm:p-5">
                    <QRScanner onScan={handleScan} />
                  </div>
                ) : (
                  <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                    <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-3 sm:p-5">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/70">
                        Barcode Scanner Input
                      </label>
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="Focus here, then fire the handheld scanner"
                        className="w-full rounded-xl border border-white/15 bg-blue-950/50 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        disabled={isScanning}
                      />
                      {scanError && (
                        <p className="mt-2 text-xs text-rose-200">{scanError}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-white/50">Most scanners press Enter automatically after the code.</p>
                      <button
                        type="submit"
                        disabled={isScanning || !barcodeInput.trim()}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Process Scan
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.section>
          </div>
        </header>

        <section className="relative -mt-10 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-blue-900/40 backdrop-blur sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-blue-950/30 p-4 sm:col-span-2 lg:col-span-1">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/60">Volunteer</p>
                  <p className="mt-2 text-sm font-semibold text-white">{user.full_name || 'Active session'}</p>
                  <p className="text-xs text-white/40">ID: {user.userId}</p>
                </div>
                <p className="mt-4 text-[0.65rem] text-white/50">Keep this device awake for uninterrupted scanning.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-blue-900/30 p-4">
                <p className="text-[0.65rem] uppercase tracking-wide text-blue-200">Success Rate</p>
                <p className="mt-1 text-2xl font-semibold text-white">{scanMetrics.successRate}%</p>
                <p className="text-xs text-white/60">{scanMetrics.successes} / {scanMetrics.total} scans</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-blue-900/30 p-4">
                <p className="text-[0.65rem] uppercase tracking-wide text-blue-200">Unique Arrivals</p>
                <p className="mt-1 text-2xl font-semibold text-white">{scanMetrics.uniqueApplicants}</p>
                <p className="text-xs text-white/60">Confirmed today</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-blue-900/30 p-4">
                <p className="text-[0.65rem] uppercase tracking-wide text-blue-200">Last Check-In</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {scanMetrics.lastSuccess ? scanMetrics.lastSuccess.timestamp.toLocaleTimeString() : '—'}
                </p>
                <p className="text-xs text-white/60">
                  {scanMetrics.lastSuccess?.applicant?.name ?? 'Waiting for first arrival'}
                </p>
              </div>
            </motion.section>

            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-2xl border px-4 py-3 text-sm sm:text-base ${
                    notification.type === 'success'
                      ? 'border-amber-300/50 bg-amber-950/40 text-amber-100'
                      : 'border-rose-400/40 bg-rose-950/40 text-rose-200'
                  }`}
                >
                        <div className="flex items-start gap-3">
                          {notification.type === 'success' ? (
                            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <div>
                            <p className="font-semibold">{notification.message}</p>
                            {notification.detail && (
                              <p className="text-xs text-white/60">{notification.detail}</p>
                            )}
                          </div>
                        </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.28 }}
                className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-blue-900/30 backdrop-blur"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-200">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                    Manual Entry
                  </h3>
                  <p className="text-xs text-white/50">Use this if the badge is damaged</p>
                </div>

                <form onSubmit={handleManualEntry} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={manualAppNumber}
                    onChange={(e) => setManualAppNumber(e.target.value)}
                    placeholder="Enter application number"
                    className="flex-1 rounded-xl border border-white/10 bg-blue-950/50 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    disabled={isScanning}
                  />
                  <button
                    type="submit"
                    disabled={isScanning || !manualAppNumber.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Log Arrival
                  </button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex max-h-[560px] flex-col rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-blue-900/30 backdrop-blur"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-200">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Recent Scans
                  </h3>
                  {scanHistory.length > 0 && (
                    <button
                      onClick={() => setScanHistory([])}
                      className="text-xs font-semibold text-white/60 transition hover:text-rose-300"
                    >
                      Clear history
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {scanHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-12 text-center text-sm text-white/50">
                      <svg className="h-10 w-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="mt-2">No scans yet. Your first arrival will appear here.</p>
                    </div>
                  ) : (
                    scanHistory.map((item, index) => (
                      <div
                        key={`${item.applicationNumber}-${index}-${item.timestamp.getTime()}`}
                        className={`rounded-xl border px-4 py-3 transition ${
                          item.success
                            ? 'border-amber-300/40 bg-amber-500/10 text-amber-100'
                            : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {item.applicant?.name || item.applicationNumber}
                            </p>
                            {item.applicant && (
                              <p className="truncate text-xs text-white/60">{item.applicant.program}</p>
                            )}
                            {item.error && (
                              <p className="mt-1 text-xs text-rose-200/90">{item.error}</p>
                            )}
                            <p className="mt-1 text-xs text-white/40">{item.timestamp.toLocaleTimeString()}</p>
                          </div>
                          <div className="flex-shrink-0 rounded-full border border-current/40 bg-black/30 p-2">
                            {item.success ? (
                              <svg className="h-4 w-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {selectedApplicant && (
        <Modal
          isOpen={!!selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          title="Applicant Details"
        >
          <div className="space-y-5 text-white">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-950/40 p-4 text-amber-100">
              <svg className="h-8 w-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Arrival confirmed</p>
                <p className="text-xs text-amber-100/70">Visitor instructions have been sent</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Name</span>
                <p className="mt-1 text-base font-semibold text-white">{selectedApplicant.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Application No.</span>
                  <p className="mt-1 font-mono text-sm text-white">{selectedApplicant.applicationNumber}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Phone</span>
                  <p className="mt-1 text-sm text-white">{selectedApplicant.phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Program</span>
                <p className="mt-1 text-sm text-white">{selectedApplicant.program || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Date</span>
                  <p className="mt-1 text-sm text-white">{selectedApplicant.date || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Time</span>
                  <p className="mt-1 text-sm text-white">{selectedApplicant.time || '—'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Location</span>
                <p className="mt-1 text-sm text-white">{selectedApplicant.location || '—'}</p>
              </div>
              <div className="rounded-2xl border border-blue-400/40 bg-blue-950/40 p-4 text-blue-100">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-200">Instructions</span>
                <p className="mt-2 text-sm leading-relaxed">{selectedApplicant.instructions || 'No special instructions available.'}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedApplicant(null)}
              className="w-full rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default VolunteerDashboard;
