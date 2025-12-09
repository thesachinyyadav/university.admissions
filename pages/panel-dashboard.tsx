import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Button, Card, Input, Modal, useToast } from '@/components/ui';
import QRScanner from '@/components/QRScanner';
import { motion, AnimatePresence } from 'framer-motion';

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
	interviewed_at: string | null;
	interviewed_by_emails?: string | null;
}

interface PanelTeacherState {
	id: string;
	name: string;
	email: string | null;
	lastConfirmedAt: string | null;
	hasActiveSession: boolean;
}

interface Notification {
	type: 'success' | 'error';
	message: string;
}

interface PanelSessionPayload {
	panel: number;
	teacherId: string;
	teacherName: string;
	teacherEmail: string | null;
	sessionToken: string;
	deviceId: string;
	lastConfirmedAt: string;
}

const STORAGE_KEY = 'panelSession';
const CONFIRMATION_INTERVAL_MS = 30 * 60 * 1000;

const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data?.message || 'Failed to load data');
	}
	return response.json();
};

export default function PanelDashboard() {
	const router = useRouter();
	const { showToast } = useToast();

	const [session, setSession] = useState<PanelSessionPayload | null>(null);
	const [panelTeachers, setPanelTeachers] = useState<PanelTeacherState[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResult, setSearchResult] = useState<Applicant | null>(null);
	const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [notification, setNotification] = useState<Notification | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [currentInterviewStatus, setCurrentInterviewStatus] = useState<'idle' | 'in-progress'>('idle');
	const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
	const [isConfirmingIdentity, setIsConfirmingIdentity] = useState(false);
	const [isScannerOpen, setIsScannerOpen] = useState(false);
	const [isScanProcessing, setIsScanProcessing] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			router.replace('/panel-login');
			return;
		}

		try {
			const parsed: PanelSessionPayload = JSON.parse(stored);
			if (!parsed?.panel || !parsed?.sessionToken) {
				router.replace('/panel-login');
				return;
			}
			setSession(parsed);
		} catch (error) {
			console.error('[panel-dashboard] invalid session payload', error);
			router.replace('/panel-login');
		}
	}, [router]);

	const { data: panelStateData, mutate: refreshPanelState } = useSWR(
		session ? `/api/panels/state?panel=${session.panel}` : null,
		fetcher,
		{ refreshInterval: 15_000 }
	);

	const { data: completedCountData, mutate: refreshCompletedCount } = useSWR<{ count: number }>(
		session ? `/api/panels/completed-count?panel=${session.panel}` : null,
		fetcher,
		{ refreshInterval: 60_000 }
	);

	useEffect(() => {
		if (panelStateData?.teachers) {
			setPanelTeachers(panelStateData.teachers);
		}
	}, [panelStateData]);

	useEffect(() => {
		if (!notification) return;
		const timer = setTimeout(() => setNotification(null), 5000);
		return () => clearTimeout(timer);
	}, [notification]);

	const nextConfirmationAt = useMemo(() => {
		if (!session?.lastConfirmedAt) {
			return null;
		}
		const last = new Date(session.lastConfirmedAt).getTime();
		if (Number.isNaN(last)) {
			return null;
		}
		return new Date(last + CONFIRMATION_INTERVAL_MS);
	}, [session]);

	useEffect(() => {
		if (!session) {
			return;
		}

		const evaluate = () => {
			if (!session.lastConfirmedAt) {
				setShowConfirmationPrompt(true);
				return;
			}
			const last = new Date(session.lastConfirmedAt).getTime();
			if (Number.isNaN(last)) {
				setShowConfirmationPrompt(true);
				return;
			}
			if (Date.now() - last >= CONFIRMATION_INTERVAL_MS) {
				setShowConfirmationPrompt(true);
			}
		};

		evaluate();
		const interval = setInterval(evaluate, 60_000);
		return () => clearInterval(interval);
	}, [session]);

	useEffect(() => {
		if (!searchResult) {
			setCurrentInterviewStatus('idle');
			return;
		}
		if (searchResult.status === 'INTERVIEW_IN_PROGRESS') {
			setCurrentInterviewStatus('in-progress');
		} else {
			setCurrentInterviewStatus('idle');
		}
	}, [searchResult]);

	const persistSession = (payload: PanelSessionPayload) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		setSession(payload);
	};

	const handleReconfirmIdentity = async () => {
		if (!session) return;
		setIsConfirmingIdentity(true);
		try {
			const response = await fetch('/api/panels/confirm-teacher', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					panel: session.panel,
					teacherId: session.teacherId,
					deviceId: session.deviceId,
					sessionToken: session.sessionToken,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || 'Unable to refresh session');
			}

			const updatedSession: PanelSessionPayload = {
				panel: data.panel,
				teacherId: data.teacher.id,
				teacherName: data.teacher.name,
				teacherEmail: data.teacher.email,
				sessionToken: data.sessionToken,
				deviceId: session.deviceId,
				lastConfirmedAt: data.teacher.lastConfirmedAt,
			};

			persistSession(updatedSession);
			setShowConfirmationPrompt(false);
			setNotification({ type: 'success', message: 'Identity confirmed. Thank you!' });
			refreshPanelState();
		} catch (error: any) {
			console.error('[panel-dashboard] reconfirm error', error);
			showToast(error.message || 'Please login again', 'error');
			localStorage.removeItem(STORAGE_KEY);
			router.replace('/panel-login');
		} finally {
			setIsConfirmingIdentity(false);
		}
	};

	const handleLogout = () => {
		setShowConfirmationPrompt(false);
		localStorage.removeItem(STORAGE_KEY);
		setSession(null);
		router.replace('/panel-login');
	};

	const handleSearch = async () => {
		if (!session) return;
		if (!searchQuery.trim()) {
			setNotification({ type: 'error', message: 'Please enter an application number' });
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch('/api/panels/search-applicant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					applicationNumber: searchQuery.trim(),
					panel: session.panel,
					sessionToken: session.sessionToken,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.message || 'Applicant not found');
			}

			setSearchResult(data.applicant);
			setSelectedApplicant(data.applicant);
			setIsModalOpen(true);
		} catch (error: any) {
			console.error('[panel-dashboard] search error', error);
			setNotification({
				type: 'error',
				message: error.message || 'Unable to locate applicant',
			});
			setSearchResult(null);
		} finally {
			setIsSearching(false);
		}
	};

	const handleStartInterview = async (applicant: Applicant) => {
		if (!session) return;
		setIsProcessing(true);
		try {
			const response = await fetch('/api/panels/start-interview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					applicationNumber: applicant.application_number,
					panel: session.panel,
					sessionToken: session.sessionToken,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || 'Failed to start interview');
			}

			setNotification({
				type: 'success',
				message: `Interview started for ${applicant.name}`,
			});
			setCurrentInterviewStatus('in-progress');
			setSearchResult((prev) =>
				prev ? { ...prev, status: 'INTERVIEW_IN_PROGRESS', interviewed_by_emails: null } : prev
			);
			setSelectedApplicant((prev) =>
				prev ? { ...prev, status: 'INTERVIEW_IN_PROGRESS', interviewed_by_emails: null } : prev
			);
			refreshPanelState();
		} catch (error: any) {
			console.error('[panel-dashboard] start interview error', error);
			setNotification({
				type: 'error',
				message: error.message || 'Could not start interview',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCompleteInterview = async (applicant: Applicant) => {
		if (!session) return;
		setIsProcessing(true);
		try {
			const response = await fetch('/api/panels/complete-interview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					applicationNumber: applicant.application_number,
					panel: session.panel,
					sessionToken: session.sessionToken,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || 'Failed to complete interview');
			}

			try {
				await fetch('/api/sms/send-interview-complete-sms', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phone: applicant.phone, name: applicant.name }),
				});
			} catch (smsError) {
				console.warn('[panel-dashboard] SMS send failed', smsError);
			}

			setNotification({
				type: 'success',
				message: `Interview completed for ${applicant.name}`,
			});
			setCurrentInterviewStatus('idle');
			setIsModalOpen(false);
			setSelectedApplicant(null);
			setSearchResult(null);
			setSearchQuery('');
			refreshCompletedCount();
			refreshPanelState();
		} catch (error: any) {
			console.error('[panel-dashboard] complete interview error', error);
			setNotification({
				type: 'error',
				message: error.message || 'Could not complete interview',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const formatDate = (value: string | null) => {
		if (!value) return 'N/A';
		const date = new Date(value);
		return date.toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const formatTime = (value: string | null) => {
		if (!value) return 'N/A';
		const date = new Date(value);
		return date.toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleScanSuccess = async (rawCode: string) => {
		if (!session || isScanProcessing) {
			return;
		}

		const trimmed = rawCode?.trim();
		if (!trimmed) {
			showToast('Invalid QR code detected. Please try again.', 'error');
			return;
		}

		const match = trimmed.match(/id=([a-f0-9-]+)/i);
		const applicationNumber = match ? match[1] : trimmed;

		setIsScanProcessing(true);

		try {
			const response = await fetch('/api/panels/search-applicant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					applicationNumber,
					panel: session.panel,
					sessionToken: session.sessionToken,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.message || 'Applicant not found for this QR code');
			}

			const applicant: Applicant = data.applicant;
			setSearchQuery(applicant.application_number);
			setSearchResult(applicant);
			setSelectedApplicant(applicant);
			setIsModalOpen(true);
			setIsScannerOpen(false);
			await handleStartInterview(applicant);
		} catch (error: any) {
			console.error('[panel-dashboard] scan error', error);
			showToast(error.message || 'Unable to process QR code', 'error');
		} finally {
			setIsScanProcessing(false);
		}
	};

	if (!session) {
		return null;
	}

	return (
		<div className="min-h-screen bg-neutral-100">
			<AnimatePresence>
				{notification && (
					<motion.div
						key={notification.message}
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						className="fixed top-4 inset-x-4 sm:left-auto sm:right-6 sm:w-80 z-50"
					>
						<div
							className={`rounded-xl border px-4 py-3 shadow-md backdrop-blur-sm flex items-start gap-3 ${
								notification.type === 'success'
									? 'border-emerald-200 bg-white text-emerald-700'
									: 'border-rose-200 bg-white text-rose-700'
							}`}
						>
							{notification.type === 'success' ? (
								<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							) : (
								<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							)}
							<div className="text-sm font-medium leading-relaxed">{notification.message}</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.main
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="container mx-auto px-3 sm:px-6 py-8 space-y-8"
			>
				<Card
					title="Panel Control Center"
					subtitle={`Panel ${session.panel} • ${session.teacherName}${session.teacherEmail ? ` (${session.teacherEmail})` : ''}`}
					headerAction={
						<div className="flex flex-wrap items-center justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setIsScannerOpen(true)}
								isLoading={isScanProcessing}
							>
								{isScanProcessing ? 'Processing…' : 'Scan QR'}
							</Button>
							<Button variant="secondary" onClick={() => refreshPanelState()}>
								Refresh Pair
							</Button>
							<Button variant="ghost" onClick={handleLogout}>
								Logout
							</Button>
						</div>
					}
					className="bg-white/90"
				>
					<div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
						<div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
							<span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
								Search or scan for quick access.
							</span>
							<span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
								QR scans start interviews automatically.
							</span>
							<span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
								Confirm prompts keep devices in sync.
							</span>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3">
								<p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Next Confirmation</p>
								<p className="text-sm font-medium text-gray-800">
									{nextConfirmationAt
										? nextConfirmationAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
										: 'Pending first check-in'}
								</p>
							</div>
							<div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3">
								<p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Last Confirmed</p>
								<p className="text-sm font-medium text-gray-800">
									{session.lastConfirmedAt
										? new Date(session.lastConfirmedAt).toLocaleString('en-IN')
										: 'Awaiting confirmation'}
								</p>
							</div>
							<div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 sm:col-span-2">
								<p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Current Status</p>
								<p className="text-sm font-semibold text-gray-900">
									{currentInterviewStatus === 'in-progress' ? 'Interview in progress' : 'Ready for next candidate'}
								</p>
							</div>
						</div>
					</div>
				</Card>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card className="bg-white" title="Interviews Completed Today">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-500 text-sm">Total marked complete</p>
								<p className="text-4xl font-bold text-gray-900 mt-2">{completedCountData?.count ?? 0}</p>
							</div>
							<div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</Card>

					<Card className="bg-white" title="Panel Availability">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-500 text-sm">Live session state</p>
								<p className="text-2xl font-semibold text-gray-900 mt-2">
									{currentInterviewStatus === 'in-progress' ? 'Interview in progress' : 'Standing by'}
								</p>
							</div>
							<div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</Card>
				</div>

				<Card title="Your Panel Pair" className="bg-white">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{panelTeachers.length === 0 && (
							<div className="text-gray-500 text-sm">No teachers linked to this panel yet.</div>
						)}
						{panelTeachers.map((teacher) => (
							<div
								key={teacher.id}
								className={`rounded-xl border p-4 transition-colors ${
									teacher.id === session.teacherId
										? 'border-primary-500 bg-primary-50'
										: 'border-gray-200 bg-white'
								}`}
							>
								<p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Teacher</p>
								<p className="text-base font-semibold text-gray-900">{teacher.name}</p>
								<p className="text-sm text-gray-600">{teacher.email || 'No email on record'}</p>
								<p className="text-xs text-gray-500 mt-3">
									Last confirmed:{' '}
									{teacher.lastConfirmedAt
										? new Date(teacher.lastConfirmedAt).toLocaleString('en-IN')
										: 'Not yet confirmed'}
								</p>
								<p className="text-xs font-semibold mt-2 text-primary-600">
									{teacher.id === session.teacherId
										? 'You are active on this device'
										: teacher.hasActiveSession
										? 'Active on paired device'
										: 'Awaiting confirmation'}
								</p>
							</div>
						))}
					</div>
				</Card>

				<Card
					title="Applicant Workflow"
					subtitle="Search by application number or scan a QR to manage interviews end-to-end."
					className="bg-white"
				>
					<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
						<div className="flex-1">
							<Input
								label="Application Number"
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Enter application number"
							/>
						</div>
						<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
							<Button
								variant="secondary"
								onClick={() => {
									setSearchQuery('');
									setSearchResult(null);
									setSelectedApplicant(null);
								}}
								disabled={!searchQuery && !searchResult}
							>
								Clear
							</Button>
							<Button
								variant="primary"
								size="lg"
								onClick={handleSearch}
								isLoading={isSearching}
								className="md:min-w-[160px]"
							>
								{isSearching ? 'Searching…' : 'Search & Open'}
							</Button>
						</div>
					</div>

					{searchResult ? (
						<div className="grid grid-cols-1 xl:grid-cols-[1.5fr,1fr] gap-4">
							<div className="space-y-4">
								<h3 className="text-base font-semibold text-gray-900">Applicant Details</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									<Detail label="Application" value={searchResult.application_number} />
									<Detail label="Name" value={searchResult.name} />
									<Detail label="Phone" value={searchResult.phone} />
									<Detail label="Program" value={searchResult.program} />
									<Detail label="Campus" value={searchResult.campus} />
									<Detail label="Scheduled Date" value={formatDate(searchResult.date)} />
									<Detail label="Scheduled Time" value={formatTime(searchResult.time)} />
									<Detail label="Status" value={searchResult.status.replace(/_/g, ' ')} />
									<Detail label="Interviewed By" value={searchResult.interviewed_by_emails || 'Not recorded yet'} />
								</div>
								{searchResult.instructions && (
									<div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
										<p className="text-xs uppercase text-primary-500 font-semibold mb-1">Instructions</p>
										<p className="text-sm text-primary-700 whitespace-pre-line">{searchResult.instructions}</p>
									</div>
								)}
							</div>

							<div className="rounded-2xl border border-gray-200 bg-white/80 p-5 flex flex-col gap-3">
								<p className="text-sm font-semibold text-gray-900">Actions</p>
								<p className="text-xs text-gray-500">Use these buttons when you need to override the auto flow.</p>
								<Button
									variant="primary"
									size="lg"
									disabled={currentInterviewStatus === 'in-progress'}
									onClick={() => selectedApplicant && handleStartInterview(selectedApplicant)}
									isLoading={isProcessing && currentInterviewStatus === 'idle'}
								>
									Start Interview
								</Button>
								<Button
									variant="outline"
									size="lg"
									disabled={currentInterviewStatus !== 'in-progress'}
									onClick={() => selectedApplicant && handleCompleteInterview(selectedApplicant)}
									isLoading={isProcessing && currentInterviewStatus === 'in-progress'}
								>
									Complete Interview & Send SMS
								</Button>
							</div>
						</div>
					) : (
						<div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-10 text-center text-sm text-gray-500">
							Enter an application number or scan a QR to get started.
						</div>
					)}
				</Card>
			</motion.main>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Applicant Overview"
				size="lg"
			>
				{selectedApplicant && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
							<Detail label="Application Number" value={selectedApplicant.application_number} />
							<Detail label="Name" value={selectedApplicant.name} />
							<Detail label="Phone" value={selectedApplicant.phone} />
							<Detail label="Program" value={selectedApplicant.program} />
							<Detail label="Status" value={selectedApplicant.status.replace(/_/g, ' ')} />
							<Detail label="Arrived At" value={formatTime(selectedApplicant.arrived_at)} />
							<Detail label="Documents Verified" value={formatTime(selectedApplicant.document_verified_at)} />
							<Detail label="Interviewed By" value={selectedApplicant.interviewed_by_emails || 'Not recorded yet'} />
						</div>
						{selectedApplicant.instructions && (
							<div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4 text-sm text-primary-700 whitespace-pre-line">
								{selectedApplicant.instructions}
							</div>
						)}
					</div>
				)}
			</Modal>

			<Modal
				isOpen={isScannerOpen}
				onClose={() => {
					if (!isScanProcessing) {
						setIsScannerOpen(false);
					}
				}}
				title="Scan Applicant QR"
				size="lg"
				closeOnBackdrop={!isScanProcessing}
			>
				<div className="space-y-5">
					<p className="text-sm text-gray-600">Scan the applicant QR to auto-start their interview.</p>
					<QRScanner onScan={handleScanSuccess} />
					{isScanProcessing && (
						<div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm text-blue-700">
							Processing scan…
						</div>
					)}
					<div className="flex justify-end gap-3">
						<Button
							variant="ghost"
							onClick={() => setIsScannerOpen(false)}
							disabled={isScanProcessing}
						>
							Close
						</Button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={showConfirmationPrompt}
				onClose={() => {}}
				title="Confirm Your Identity"
				closeOnBackdrop={false}
				showCloseButton={false}
			>
				<div className="space-y-4 text-center">
					<p className="text-gray-700 text-sm">
						Still on Panel {session.panel}? Tap confirm so both devices stay aligned. We check in about every 30 minutes.
					</p>
					<div className="flex flex-col sm:flex-row gap-3">
						<Button
							variant="secondary"
							fullWidth
							onClick={handleReconfirmIdentity}
							isLoading={isConfirmingIdentity}
						>
							{isConfirmingIdentity ? 'Confirming…' : 'Yes, this is me'}
						</Button>
						<Button
							variant="outline"
							fullWidth
							onClick={handleLogout}
							disabled={isConfirmingIdentity}
						>
							Switch Panel
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3">
			<p className="text-xs uppercase text-gray-500 font-semibold">{label}</p>
			<p className="text-sm text-gray-900 font-medium break-words">{value}</p>
		</div>
	);
}
