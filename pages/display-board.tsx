import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

interface DisplayApplicant {
  applicationNumber: string;
  name: string;
  program: string;
  location?: string | null;
  instructions?: string | null;
  status: string;
  arrivedAt?: string | null;
  alreadyProcessed?: boolean;
}

type ViewState = 'idle' | 'success' | 'error';

const BUFFER_RESET_THRESHOLD_MS = 100;
const IDLE_RESET_DELAY_MS = 120_000;
const ERROR_RESET_DELAY_MS = 12_000;

const DEFAULT_IDLE_TEXT = {
  headline: 'WELCOME',
  subline: 'SCAN TO CONTINUE',
  footer: 'POWERED BY SOCIO',
};

const normalizeScan = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  const queryMatch = trimmed.match(/application(?:Number|_number|No)?=([A-Za-z0-9-]+)/i);
  if (queryMatch) {
    return queryMatch[1];
  }

  return trimmed;
};

const extractFloorCue = (instructions?: string | null, location?: string | null) => {
  if (!instructions && !location) {
    return { floor: '', room: '' };
  }

  const text = [instructions, location].filter(Boolean).join(' ');
  
  // Extract floor (e.g., "Floor 1", "1st Floor", "FLOOR1")
  const floorMatch = text.match(/floor\s*(?:number)?\s*([A-Za-z0-9-]+)/i);
  const floor = floorMatch ? floorMatch[1] : '';
  
  // Extract room number (e.g., "Room 101", "101", "room no 101")
  const roomMatch = text.match(/(?:room|rm)\s*(?:no\.?|number)?\s*([A-Za-z0-9-]+)|\b(\d{3,})\b/i);
  const room = roomMatch ? (roomMatch[1] || roomMatch[2]) : '';
  
  return { floor, room };
};

const formatTime = (ts?: number | null) => {
  if (!ts) {
    return '';
  }
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(ts);
};

export default function DisplayBoardPage() {
  const [view, setView] = useState<ViewState>('idle');
  const [currentApplicant, setCurrentApplicant] = useState<DisplayApplicant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<number | null>(null);
  const [lastApplicationNumber, setLastApplicationNumber] = useState<string | null>(null);

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef<number>(0);
  const resetTimeoutRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const pendingScanRef = useRef<string | null>(null);

  const { floor: floorCue, room: roomCue } = useMemo(
    () => extractFloorCue(currentApplicant?.instructions, currentApplicant?.location),
    [currentApplicant?.instructions, currentApplicant?.location]
  );

  const clearScheduledReset = () => {
    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  const scheduleReset = (delay: number) => {
    clearScheduledReset();
    resetTimeoutRef.current = window.setTimeout(() => {
      setView('idle');
      setCurrentApplicant(null);
      setErrorMessage(null);
      setLastApplicationNumber(null);
    }, delay);
  };

  const showApplicant = (applicant: DisplayApplicant) => {
    setCurrentApplicant(applicant);
    setErrorMessage(null);
    setView('success');
    setLastScanTimestamp(Date.now());
    setLastApplicationNumber(applicant.applicationNumber);
    scheduleReset(IDLE_RESET_DELAY_MS);
  };

  const showError = (message: string) => {
    setCurrentApplicant(null);
    setView('error');
    setErrorMessage(message);
    setLastScanTimestamp(Date.now());
    setLastApplicationNumber(null);
    scheduleReset(ERROR_RESET_DELAY_MS);
  };

  const processScan = async (rawInput: string) => {
    const applicationNumber = normalizeScan(rawInput);
    if (!applicationNumber) {
      return;
    }

    try {
      processingRef.current = true;
      const response = await fetch('/api/display/mark-arrived', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationNumber }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        const errorText = payload?.error || 'Scan not recognized';
        showError(errorText.toUpperCase());
        return;
      }

      const applicant = payload.applicant as DisplayApplicant;
      applicant.alreadyProcessed = Boolean(payload.alreadyProcessed);
      showApplicant(applicant);
    } catch (error) {
      console.error('[display-board] scan failed', error);
      showError('NETWORK ERROR. PLEASE TRY AGAIN.');
    } finally {
      processingRef.current = false;
      if (pendingScanRef.current) {
        const next = pendingScanRef.current;
        pendingScanRef.current = null;
        void processScan(next);
      }
    }
  };

  const queueScan = (value: string) => {
    if (processingRef.current) {
      pendingScanRef.current = value;
      return;
    }
    void processScan(value);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > BUFFER_RESET_THRESHOLD_MS) {
        bufferRef.current = '';
      }

      if (event.key === 'Enter') {
        const buffered = bufferRef.current.trim();
        bufferRef.current = '';
        if (buffered) {
          event.preventDefault();
          queueScan(buffered);
        }
      } else if (event.key.length === 1) {
        bufferRef.current += event.key;
      }

      lastKeyTimeRef.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearScheduledReset();
    };
  }, []);

  const idleContent = (
    <div className="flex flex-col items-center justify-center text-center space-y-10">
      <p className="text-6xl md:text-7xl font-black tracking-[0.3em] text-white">
        {DEFAULT_IDLE_TEXT.headline}
      </p>
      <p className="text-4xl md:text-5xl text-slate-200 uppercase tracking-[0.4em]">
        {DEFAULT_IDLE_TEXT.subline}
      </p>
      <p className="text-3xl md:text-4xl text-slate-500 uppercase tracking-[0.5em]">
        {DEFAULT_IDLE_TEXT.footer}
      </p>
    </div>
  );

  const successContent = currentApplicant && (
    <div className="flex w-full max-w-7xl flex-col items-center justify-center text-center space-y-12">
      <p className="text-4xl md:text-5xl uppercase tracking-[0.35em] text-slate-300 font-semibold">
        WELCOME TO CHRIST UNIVERSITY FOR ADMISSION PROCESS
      </p>
      <div className="space-y-6">
        <p className="text-9xl md:text-[10rem] font-black drop-shadow-2xl leading-none">
          <span className="text-slate-400">HI </span>
          <span className="text-white">{currentApplicant.name?.toUpperCase()}</span>
        </p>
      </div>
      <div className="space-y-6">
        <p className="text-5xl md:text-6xl text-slate-200 font-semibold uppercase tracking-wide">
          PROCEED TO
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {floorCue && (
            <div className="border-4 border-amber-400 bg-amber-400/10 px-8 py-6 rounded-2xl shadow-2xl">
              <p className="text-6xl md:text-7xl text-amber-300 font-black uppercase drop-shadow-lg">
                FLOOR {floorCue}
              </p>
            </div>
          )}
          {roomCue && (
            <div className="border-4 border-amber-400 bg-amber-400/10 px-8 py-6 rounded-2xl shadow-2xl">
              <p className="text-6xl md:text-7xl text-amber-300 font-black uppercase drop-shadow-lg">
                ROOM {roomCue}
              </p>
            </div>
          )}
          {!floorCue && !roomCue && (
            <div className="border-4 border-amber-400 bg-amber-400/10 px-8 py-6 rounded-2xl shadow-2xl">
              <p className="text-6xl md:text-7xl text-amber-300 font-black uppercase drop-shadow-lg">
                THE ASSIGNED FLOOR
              </p>
            </div>
          )}
        </div>
      </div>
      {currentApplicant.program && (
        <p className="text-3xl md:text-4xl text-sky-200 uppercase tracking-[0.25em] font-medium">
          {currentApplicant.program}
        </p>
      )}
      {currentApplicant.instructions && (
        <p className="text-2xl md:text-3xl text-slate-200 max-w-5xl leading-relaxed">
          {currentApplicant.instructions}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-8 text-2xl md:text-3xl text-slate-400 uppercase tracking-[0.25em] pt-4">
        <span>APPLICATION #{currentApplicant.applicationNumber}</span>
        {currentApplicant.alreadyProcessed && <span>STATUS: {currentApplicant.status.replace(/[_-]/g, ' ')}</span>}
      </div>
    </div>
  );

  const errorContent = errorMessage && (
    <div className="flex flex-col items-center justify-center text-center space-y-8">
      <p className="text-7xl md:text-8xl font-black text-red-400">
        {errorMessage}
      </p>
      <p className="text-3xl md:text-4xl text-slate-400 uppercase tracking-[0.3em]">
        PLEASE TRY AGAIN
      </p>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex flex-col">
      <header className="px-6 md:px-10 pt-4 md:pt-6 flex items-center justify-between text-slate-400 uppercase tracking-[0.3em] flex-shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <Image src="/socio.png" alt="Socio Logo" width={60} height={60} className="object-contain md:w-[80px] md:h-[80px]" />
          <span className="text-lg md:text-2xl lg:text-3xl font-semibold">Admissions Welcome Desk</span>
        </div>
        <span className="text-base md:text-xl lg:text-2xl">{formatTime(lastScanTimestamp)}</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 md:px-6 overflow-hidden">
        {view === 'idle' && idleContent}
        {view === 'success' && successContent}
        {view === 'error' && errorContent}
      </main>

      <footer className="px-6 md:px-10 pb-4 md:pb-6 flex items-center justify-between text-slate-500 uppercase tracking-[0.4em] text-base md:text-lg lg:text-2xl flex-shrink-0">
        <span className="font-medium">{lastApplicationNumber ? `LAST SCAN: ${lastApplicationNumber}` : DEFAULT_IDLE_TEXT.footer}</span>
        <div className="flex items-center gap-3 md:gap-4">
          <span className="font-semibold">POWERED BY SOCIO</span>
          <Image src="/socio.png" alt="Socio Logo" width={30} height={30} className="object-contain opacity-70 md:w-[40px] md:h-[40px]" />
        </div>
      </footer>
    </div>
  );
}
