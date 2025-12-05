import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  ConfirmModal,
  Badge,
  StatsCard
} from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Panel {
  panel_id: string;
  panel_login: string;
  teacher_name_1: string;
  teacher_name_2: string;
  assigned_floor_id: string;
  floor_name?: string;
  is_active: boolean;
}

interface Floor {
  floor_id: string;
  floor_name: string;
  floor_number: number;
}

interface Teacher {
  teacher_id: string;
  name: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function PanelManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeletePanel, setPendingDeletePanel] = useState<Panel | null>(null);

  const [formData, setFormData] = useState({
    panel_login: '',
    password: '',
    teacher_name_1: '',
    teacher_name_2: '',
    assigned_floor_id: '',
  });

  useEffect(() => {
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
    fetchPanels();
    fetchFloors();
    fetchTeachers();
  }, [router]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchPanels = async () => {
    try {
      const response = await fetch('/api/admin/panels/list');
      const data = await response.json();
      if (response.ok) {
        setPanels(data.panels || []);
      }
    } catch (error) {
      console.error('Error fetching panels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFloors = async () => {
    try {
      const response = await fetch('/api/admin/floors/list');
      const data = await response.json();
      if (response.ok) {
        setFloors(data.floors || []);
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers/list');
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const openCreateModal = () => {
    setEditingPanel(null);
    setFormData({
      panel_login: '',
      password: '',
      teacher_name_1: '',
      teacher_name_2: '',
      assigned_floor_id: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (panel: Panel) => {
    setEditingPanel(panel);
    setFormData({
      panel_login: panel.panel_login,
      password: '',
      teacher_name_1: panel.teacher_name_1,
      teacher_name_2: panel.teacher_name_2,
      assigned_floor_id: panel.assigned_floor_id,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teacher_name_1 || !formData.teacher_name_2 || !formData.assigned_floor_id) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    if (!editingPanel && !formData.panel_login) {
      setNotification({
        type: 'error',
        message: 'Panel login is required',
      });
      return;
    }

    try {
      const url = editingPanel
        ? `/api/admin/panels/update`
        : `/api/admin/panels/create`;

      const body = editingPanel
        ? {
            panel_id: editingPanel.panel_id,
            teacher_name_1: formData.teacher_name_1,
            teacher_name_2: formData.teacher_name_2,
            assigned_floor_id: formData.assigned_floor_id,
            password: formData.password || undefined,
          }
        : formData;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: editingPanel
            ? 'Panel updated successfully'
            : 'Panel created successfully',
        });
        setIsModalOpen(false);
        fetchPanels();
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Operation failed',
        });
      }
    } catch (error) {
      console.error('Error saving panel:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  const handleToggleActive = async (panel: Panel) => {
    try {
      const response = await fetch('/api/admin/panels/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panel_id: panel.panel_id,
          is_active: !panel.is_active,
        }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: `Panel ${!panel.is_active ? 'activated' : 'deactivated'}`,
        });
        fetchPanels();
      } else {
        const data = await response.json();
        setNotification({
          type: 'error',
          message: data.message || 'Failed to update panel status',
        });
      }
    } catch (error) {
      console.error('Error toggling panel:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  const deletePanel = async (panelId: string) => {
    try {
      const response = await fetch('/api/admin/panels/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel_id: panelId }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Panel deleted successfully',
        });
        fetchPanels();
      } else {
        const data = await response.json();
        setNotification({
          type: 'error',
          message: data.message || 'Failed to delete panel',
        });
      }
    } catch (error) {
      console.error('Error deleting panel:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  const filteredPanels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return panels;
    }

    return panels.filter((panel) => {
      const loginMatch = panel.panel_login.toLowerCase().includes(query);
      const teacherOneMatch = panel.teacher_name_1?.toLowerCase().includes(query);
      const teacherTwoMatch = panel.teacher_name_2?.toLowerCase().includes(query);
      const floorMatch = panel.floor_name?.toLowerCase().includes(query);
      return loginMatch || teacherOneMatch || teacherTwoMatch || floorMatch;
    });
  }, [panels, searchQuery]);

  const panelStats = useMemo(() => {
    const totalPanels = panels.length;
    const activePanels = panels.filter((panel) => panel.is_active).length;
    const inactivePanels = totalPanels - activePanels;
    const assignedFloors = new Set(
      panels
        .filter((panel) => panel.assigned_floor_id)
        .map((panel) => panel.assigned_floor_id)
    ).size;

    return [
      {
        title: 'Total Panels',
        value: totalPanels,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.105-.895 2-2 2H6a2 2 0 01-2-2V7c0-1.105.895-2 2-2h4a2 2 0 012 2v4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 17c0 1.105-.895 2-2 2h-4a2 2 0 01-2-2v-4c0-1.105.895-2 2-2h4a2 2 0 012 2v4z" />
          </svg>
        )
      },
      {
        title: 'Active Panels',
        value: activePanels,
        change: totalPanels ? `${Math.round((activePanels / totalPanels) * 100)}% active` : undefined,
        trend: 'up' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      },
      {
        title: 'Inactive Panels',
        value: inactivePanels,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 5.636l12.728 12.728" />
          </svg>
        )
      },
      {
        title: 'Floors Covered',
        value: `${assignedFloors}/${floors.length || 0}`,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M9 3h6" />
          </svg>
        )
      }
    ];
  }, [floors.length, panels]);

  const handleConfirmDelete = async () => {
    if (!pendingDeletePanel) {
      return;
    }

    await deletePanel(pendingDeletePanel.panel_id);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 max-w-sm"
          >
            <div
              className={`card shadow-xl border-l-4 ${
                notification.type === 'success'
                  ? 'border-l-green-500'
                  : 'border-l-red-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">This message will dismiss automatically.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8 space-y-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Panel Management</h1>
              <p className="text-gray-600 max-w-2xl">
                Keep interview panels organised, ensure the right faculty members are paired, and stay on top of
                activation status in one clean view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push('/master-admin')}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              >
                Back to dashboard
              </Button>
              <Button
                onClick={openCreateModal}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Create panel
              </Button>
            </div>
          </div>

          <Card variant="bordered" className="shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {panelStats.map((stat) => (
                <StatsCard key={stat.title} {...stat} icon={stat.icon} />
              ))}
            </div>
          </Card>

          <Card
            title="Panels overview"
            subtitle={`Showing ${filteredPanels.length} ${filteredPanels.length === 1 ? 'panel' : 'panels'}${
              searchQuery ? ` for “${searchQuery}”` : ''
            }`}
            headerAction={
              <div className="w-full sm:w-72">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by panel or faculty"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
            }
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600" />
                <p className="mt-4 text-sm text-gray-500">Loading panels, please hold on…</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-xs">
                      <th scope="col" className="px-4 sm:px-6 py-3">Panel ID</th>
                      <th scope="col" className="px-4 sm:px-6 py-3">Faculty</th>
                      <th scope="col" className="px-4 sm:px-6 py-3">Floor</th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-center">Status</th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredPanels.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                          {searchQuery
                            ? 'No panels match your search. Try a different name or floor.'
                            : 'No panels yet. Create one to get started.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPanels.map((panel) => (
                        <tr key={panel.panel_id} className="transition-colors hover:bg-gray-50/60">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="font-semibold text-gray-900">{panel.panel_login}</div>
                            <p className="text-xs text-gray-500 mt-1">#{panel.panel_id}</p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <p className="font-medium text-gray-900">{panel.teacher_name_1}</p>
                            <p className="text-xs text-gray-500 mt-1">{panel.teacher_name_2}</p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            {panel.floor_name ? (
                              <Badge variant="info" size="sm">{panel.floor_name}</Badge>
                            ) : (
                              <span className="text-xs text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <Badge variant={panel.is_active ? 'success' : 'error'} size="sm" dot>
                              {panel.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(panel)}
                                leftIcon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H3v-4.5L16.732 3.732z" />
                                  </svg>
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(panel)}
                                leftIcon={
                                  panel.is_active ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                    </svg>
                                  )
                                }
                                className={panel.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                              >
                                {panel.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setPendingDeletePanel(panel)}
                                leftIcon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </motion.main>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPanel ? 'Edit Panel' : 'Create New Panel'}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Panel login"
                placeholder="e.g., panel01"
                value={formData.panel_login}
                onChange={(e) => setFormData({ ...formData, panel_login: e.target.value })}
                disabled={!!editingPanel}
                required={!editingPanel}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
                  </svg>
                }
                helperText={editingPanel ? 'Panel logins cannot be changed after creation.' : undefined}
              />

              <Input
                type="password"
                label={editingPanel ? 'Update password' : 'Password'}
                placeholder={editingPanel ? 'Leave blank to keep the existing password' : 'Enter password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingPanel}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v10H5z" />
                  </svg>
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Teacher 1"
                value={formData.teacher_name_1}
                onChange={(e) => setFormData({ ...formData, teacher_name_1: e.target.value })}
                required
                options={[
                  { value: '', label: 'Select the first teacher', disabled: true },
                  ...teachers
                    .filter((teacher) => teacher.name !== formData.teacher_name_2)
                    .map((teacher) => ({ value: teacher.name, label: teacher.name }))
                ]}
                helperText={
                  teachers.length === 0
                    ? 'No teachers found yet. Head to Teachers to add faculty first.'
                    : undefined
                }
              />

              <Select
                label="Teacher 2"
                value={formData.teacher_name_2}
                onChange={(e) => setFormData({ ...formData, teacher_name_2: e.target.value })}
                required
                options={[
                  { value: '', label: 'Select the second teacher', disabled: true },
                  ...teachers
                    .filter((teacher) => teacher.name !== formData.teacher_name_1)
                    .map((teacher) => ({ value: teacher.name, label: teacher.name }))
                ]}
                helperText={
                  teachers.length === 0
                    ? 'No teachers found yet. Head to Teachers to add faculty first.'
                    : undefined
                }
              />
            </div>

            <Select
              label="Assigned floor"
              value={formData.assigned_floor_id}
              onChange={(e) => setFormData({ ...formData, assigned_floor_id: e.target.value })}
              required
              options={[
                { value: '', label: 'Select a floor', disabled: true },
                ...floors.map((floor) => ({ value: floor.floor_id, label: floor.floor_name }))
              ]}
              helperText={floors.length === 0 ? 'No floors available yet. Add floors first to assign panels.' : undefined}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingPanel ? 'Save changes' : 'Create panel'}</Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!pendingDeletePanel}
        onClose={() => setPendingDeletePanel(null)}
        onConfirm={handleConfirmDelete}
        title="Delete panel"
        message={
          pendingDeletePanel
            ? `Are you sure you want to remove ${pendingDeletePanel.panel_login}? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
      />
    </div>
  );
}
