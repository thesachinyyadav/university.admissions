import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Card, Button, Input, Select } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface PanelTeacher {
  id: string;
  name: string;
  email: string | null;
  lastConfirmedAt: string | null;
  hasActiveSession: boolean;
}

interface TeacherSearchResult {
  id: string;
  name: string;
  email: string | null;
  panel: number | null;
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
const DEVICE_STORAGE_KEY = 'panelDeviceId';
const PANEL_CAPACITY = 2;

export default function PanelLogin() {
  const router = useRouter();
  const { showToast } = useToast();

  const [panelInput, setPanelInput] = useState('');
  const [isFetchingTeachers, setIsFetchingTeachers] = useState(false);
  const [teachers, setTeachers] = useState<PanelTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastFetchedPanel, setLastFetchedPanel] = useState<number | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeacherSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [assigningTeacherId, setAssigningTeacherId] = useState<string | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [pendingTeacher, setPendingTeacher] = useState<TeacherSearchResult | null>(null);
  const [removeSelectionId, setRemoveSelectionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const session: PanelSessionPayload = JSON.parse(raw);
      if (session?.panel && session?.sessionToken) {
        router.replace('/panel-dashboard');
      }
    } catch (error) {
      console.error('[panel-login] Invalid session payload', error);
    }
  }, [router]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const panelQuery = router.query.panel;
    if (typeof panelQuery === 'string' && panelQuery.trim().length > 0) {
      setPanelInput(panelQuery.trim());
    }
  }, [router.isReady, router.query.panel]);

  const deviceId = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored) {
      return stored;
    }
    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, generated);
    return generated;
  }, []);

  const handleFetchTeachers = async (e: React.FormEvent) => {
    e.preventDefault();
    const panelNumber = Number(panelInput.trim());

    if (!panelNumber || !Number.isInteger(panelNumber) || panelNumber <= 0) {
      showToast('Please enter a valid panel number', 'error');
      return;
    }

    setLastFetchedPanel(panelNumber);
    setIsFetchingTeachers(true);
    setSelectedTeacherId('');

    try {
      const response = await fetch(`/api/panels/teachers?panel=${panelNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to load panel teachers');
      }

      if (!data?.teachers?.length) {
        showToast(`No teachers found for Panel ${panelNumber}`, 'error');
        setTeachers([]);
        return;
      }

      setTeachers(data.teachers);
      showToast(`Welcome Panel ${panelNumber}! Select your name to continue.`, 'success');
    } catch (error: any) {
      console.error('[panel-login] fetch error', error);
      showToast(error.message || 'Something went wrong fetching teachers', 'error');
    } finally {
      setIsFetchingTeachers(false);
    }
  };

  const handleConfirmIdentity = async () => {
    if (!lastFetchedPanel || !selectedTeacherId) {
      showToast('Please choose your name to continue', 'error');
      return;
    }

    setIsConfirming(true);

    try {
      const response = await fetch('/api/panels/confirm-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panel: lastFetchedPanel,
          teacherId: selectedTeacherId,
          deviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to confirm your identity');
      }

      const payload: PanelSessionPayload = {
        panel: data.panel,
        teacherId: data.teacher.id,
        teacherName: data.teacher.name,
        teacherEmail: data.teacher.email,
        sessionToken: data.sessionToken,
        deviceId,
        lastConfirmedAt: data.teacher.lastConfirmedAt,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      showToast(`Logged in as ${data.teacher.name}.`, 'success');
      router.replace('/panel-dashboard');
    } catch (error: any) {
      console.error('[panel-login] confirm error', error);
      showToast(error.message || 'Unable to complete login', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId);

  const handleOpenSearch = () => {
    if (!lastFetchedPanel) {
      showToast('Enter your panel number first', 'error');
      return;
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchModalOpen(true);
  };

  const handleSearchTeachers = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!lastFetchedPanel) {
      showToast('Enter your panel number first', 'error');
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      showToast('Type at least 2 characters to search', 'error');
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/panels/search-teachers?query=${encodeURIComponent(trimmedQuery)}&limit=10`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to search teachers');
      }

      setSearchResults(data.teachers ?? []);
      if (!data?.teachers?.length) {
        showToast('No teachers matched your search', 'error');
      }
    } catch (error: any) {
      console.error('[panel-login] search error', error);
      showToast(error.message || 'Unable to search teachers', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const executeAssignment = async (
    teacher: TeacherSearchResult,
    removeTeacherId?: string | null
  ) => {
    if (!lastFetchedPanel) {
      showToast('Enter your panel number first', 'error');
      return;
    }

    setAssigningTeacherId(teacher.id);

    try {
      const response = await fetch('/api/panels/assign-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panel: lastFetchedPanel,
          teacherId: teacher.id,
          deviceId,
          ...(removeTeacherId ? { removeTeacherId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to assign teacher');
      }

      const assignedTeacher: PanelTeacher = {
        id: data.teacher.id,
        name: data.teacher.name,
        email: data.teacher.email,
        lastConfirmedAt: null,
        hasActiveSession: false,
      };

      const clearedTeacherIds: string[] = Array.isArray(data.clearedTeacherIds)
        ? data.clearedTeacherIds
        : [];

      const removedTeacherName = (removeTeacherId && teachers.find((t) => t.id === removeTeacherId)?.name) || null;

      let refreshed = false;

      try {
        const refreshResponse = await fetch(`/api/panels/teachers?panel=${lastFetchedPanel}`);
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && Array.isArray(refreshData?.teachers)) {
          setTeachers(refreshData.teachers);
          refreshed = true;
        }
      } catch (refreshError) {
        console.error('[panel-login] refresh teachers error', refreshError);
      }

      if (!refreshed) {
        setTeachers((prev) => {
          const filtered = prev.filter(
            (item) => item.id !== assignedTeacher.id && !clearedTeacherIds.includes(item.id)
          );
          return [...filtered, assignedTeacher].sort((a, b) => a.name.localeCompare(b.name));
        });
      }

      setSelectedTeacherId(assignedTeacher.id);

      setSearchResults((prev) =>
        prev.map((result) => {
          if (result.id === assignedTeacher.id) {
            return { ...result, panel: lastFetchedPanel };
          }
          if (clearedTeacherIds.includes(result.id)) {
            return { ...result, panel: null };
          }
          return result;
        })
      );

      const pieces = [
        `${assignedTeacher.name} is now linked to Panel ${lastFetchedPanel}.`,
      ];
      if (Number.isInteger(data.movedFromPanel) && data.movedFromPanel !== lastFetchedPanel) {
        pieces.push(`Moved from Panel ${data.movedFromPanel}.`);
      }
      if (clearedTeacherIds.length > 0) {
        if (removedTeacherName) {
          pieces.push(`Removed ${removedTeacherName} from this panel.`);
        } else {
          pieces.push('Removed the previously selected panel teacher.');
        }
      }

      showToast(pieces.join(' '), 'success');
      setIsSearchModalOpen(false);
      setIsReplaceModalOpen(false);
      setPendingTeacher(null);
      setRemoveSelectionId(null);
    } catch (error: any) {
      console.error('[panel-login] assign error', error);
      showToast(error.message || 'Unable to assign teacher to panel', 'error');
    } finally {
      setAssigningTeacherId(null);
    }
  };

  const handleAssignTeacher = (teacher: TeacherSearchResult) => {
    if (!lastFetchedPanel) {
      showToast('Enter your panel number first', 'error');
      return;
    }

    const isAlreadyOnPanel = teachers.some((existing) => existing.id === teacher.id);

    if (isAlreadyOnPanel) {
      setSelectedTeacherId(teacher.id);
      setIsSearchModalOpen(false);
      showToast(`${teacher.name} is already assigned to Panel ${lastFetchedPanel}.`, 'info');
      return;
    }

    if (teachers.length >= PANEL_CAPACITY) {
      setPendingTeacher(teacher);
      const defaultRemoval = teachers.find((candidate) => candidate.id !== teacher.id);
      setRemoveSelectionId(defaultRemoval ? defaultRemoval.id : null);
      setIsReplaceModalOpen(true);
      return;
    }

    executeAssignment(teacher);
  };

  const handleConfirmReplacement = () => {
    if (!pendingTeacher) {
      setIsReplaceModalOpen(false);
      return;
    }

    if (!removeSelectionId) {
      showToast('Select which teacher to remove first', 'error');
      return;
    }

    executeAssignment(pendingTeacher, removeSelectionId);
  };

  const handleCancelReplacement = () => {
    setIsReplaceModalOpen(false);
    setPendingTeacher(null);
    setRemoveSelectionId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="shadow-2xl p-6 sm:p-8 bg-white/95">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel Login</h1>
            <p className="text-gray-600">
              Enter your panel number to view your teacher pair and confirm your identity.
            </p>
          </motion.div>

          <form onSubmit={handleFetchTeachers} className="space-y-4">
            <Input
              label="Panel Number"
              type="number"
              min={1}
              value={panelInput}
              onChange={(event) => setPanelInput(event.target.value)}
              placeholder="Enter panel number (e.g. 1)"
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isFetchingTeachers}
            >
              {isFetchingTeachers ? 'Checking panel…' : 'Continue'}
            </Button>
          </form>

          {teachers.length > 0 && (
            <div className="mt-8 space-y-5">
              <div>
                <Select
                  label="Who are you?"
                  value={selectedTeacherId}
                  onChange={(event) => setSelectedTeacherId(event.target.value)}
                  options={[
                    { value: '', label: 'Select your name' },
                    ...teachers.map((teacher) => ({
                      value: teacher.id,
                      label: `${teacher.name}${teacher.email ? ` (${teacher.email})` : ''}`,
                    })),
                  ]}
                />
              </div>

              {selectedTeacher && (
                <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                  <p className="text-sm text-primary-600 font-semibold mb-1">
                    Confirm your identity
                  </p>
                  <p className="text-gray-800 font-medium">{selectedTeacher.name}</p>
                  <p className="text-gray-600 text-sm">
                    {selectedTeacher.email || 'No email on record'}
                  </p>
                  {selectedTeacher.lastConfirmedAt && (
                    <p className="text-xs text-primary-500 mt-2">
                      Last confirmed at {new Date(selectedTeacher.lastConfirmedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={!selectedTeacherId}
                isLoading={isConfirming}
                onClick={handleConfirmIdentity}
              >
                {isConfirming ? 'Confirming…' : 'Yes, this is me'}
              </Button>
            </div>
          )}

          {lastFetchedPanel && (
            <div className="mt-8">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleOpenSearch}
              >
                Can't find your name? Search and assign a teacher
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Search Teachers"
        size="lg"
      >
        <form onSubmit={handleSearchTeachers} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search by name or email"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Start typing to search"
            />
          </div>
          <Button type="submit" variant="primary" isLoading={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          {searchResults.length === 0 && !isSearching && (
            <p className="text-gray-500 text-sm">
              Use the search above to find a teacher. You'll be able to assign them to this panel once selected.
            </p>
          )}

          {searchResults.map((teacher) => {
            const isAssignedHere = teacher.panel === lastFetchedPanel;
            const assignedElsewhere = typeof teacher.panel === 'number' && teacher.panel !== lastFetchedPanel;
            const panelMessage = assignedElsewhere
              ? `Currently assigned to Panel ${teacher.panel}. Selecting this will move them here.`
              : isAssignedHere
              ? `Already assigned to Panel ${lastFetchedPanel}.`
              : 'Not currently assigned to any panel.';
            const panelMessageClass = assignedElsewhere
              ? 'text-red-500'
              : isAssignedHere
              ? 'text-primary-600'
              : 'text-gray-500';
            const buttonLabel = assignedElsewhere
              ? 'Move to this panel'
              : isAssignedHere
              ? 'Use this panel'
              : 'Assign to this panel';

            return (
              <div
                key={teacher.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-200 rounded-xl p-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.email || 'No email listed'}</p>
                  <p className={`text-xs mt-1 ${panelMessageClass}`}>{panelMessage}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={assigningTeacherId === teacher.id}
                  isLoading={assigningTeacherId === teacher.id}
                  onClick={() => handleAssignTeacher(teacher)}
                >
                  {buttonLabel}
                </Button>
              </div>
            );
          })}

          {lastFetchedPanel && searchResults.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              When you continue, you can choose which existing panel member to replace with your selection.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isReplaceModalOpen}
        onClose={handleCancelReplacement}
        title="Choose Who To Replace"
        size="md"
        closeOnBackdrop={false}
      >
        {pendingTeacher && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600">
                Panel {lastFetchedPanel} currently has the following teachers. Select the one you want to
                replace with <span className="font-semibold text-gray-800">{pendingTeacher.name}</span>.
              </p>
            </div>

            <div className="space-y-3">
              {teachers.map((teacher) => (
                <label
                  key={teacher.id}
                  className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-colors ${
                    removeSelectionId === teacher.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="remove-teacher"
                    value={teacher.id}
                    checked={removeSelectionId === teacher.id}
                    onChange={() => setRemoveSelectionId(teacher.id)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{teacher.name}</p>
                    <p className="text-sm text-gray-600">{teacher.email || 'No email on record'}</p>
                    {teacher.lastConfirmedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last confirmed {new Date(teacher.lastConfirmedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleCancelReplacement} disabled={assigningTeacherId !== null}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReplacement}
                isLoading={pendingTeacher ? assigningTeacherId === pendingTeacher.id : false}
              >
                Replace & Assign
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
