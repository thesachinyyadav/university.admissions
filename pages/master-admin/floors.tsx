import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Modal } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Floor {
  floor_id: string;
  floor_name: string;
  floor_number: number;
  assigned_programs: string[];
  description: string;
  is_active: boolean;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function FloorManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    floor_id: '',
    floor_name: '',
    floor_number: '',
    assigned_programs: '',
    description: '',
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
    fetchFloors();
  }, [router]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchFloors = async () => {
    try {
      const response = await fetch('/api/admin/floors/list-all');
      if (response.ok) {
        const data = await response.json();
        setFloors(data.floors);
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  const handleOpenModal = (floor?: Floor) => {
    if (floor) {
      setIsEditing(true);
      setFormData({
        floor_id: floor.floor_id,
        floor_name: floor.floor_name,
        floor_number: floor.floor_number.toString(),
        assigned_programs: floor.assigned_programs.join(', '),
        description: floor.description || '',
      });
    } else {
      setIsEditing(false);
      setFormData({
        floor_id: '',
        floor_name: '',
        floor_number: '',
        assigned_programs: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const programsArray = formData.assigned_programs
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);

    try {
      const url = isEditing ? '/api/admin/floors/update' : '/api/admin/floors/create';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          floor_number: parseInt(formData.floor_number),
          assigned_programs: programsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: isEditing ? 'Floor updated successfully' : 'Floor created successfully',
        });
        setIsModalOpen(false);
        fetchFloors();
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Operation failed',
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  const handleToggleActive = async (floorId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/floors/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor_id: floorId, is_active: !isActive }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: `Floor ${!isActive ? 'activated' : 'deactivated'} successfully`,
        });
        fetchFloors();
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to update floor status',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50"
          >
            <div className={`px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Floor Management</h1>
            <p className="text-gray-600">Configure floors and assign programs</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md"
          >
            + Create Floor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {floors.map((floor) => (
            <motion.div
              key={floor.floor_id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{floor.floor_name}</h3>
                  <p className="text-sm text-gray-500">Floor {floor.floor_number}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${floor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {floor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {floor.description && (
                <p className="text-sm text-gray-600 mb-3">{floor.description}</p>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Assigned Programs:</p>
                <div className="flex flex-wrap gap-2">
                  {floor.assigned_programs.length > 0 ? (
                    floor.assigned_programs.map((program, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                        {program}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No programs assigned</span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenModal(floor)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(floor.floor_id, floor.is_active)}
                  className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${floor.is_active ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                >
                  {floor.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {floors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No floors created yet. Click "Create Floor" to add one.</p>
          </div>
        )}
      </motion.div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? 'Edit Floor' : 'Create New Floor'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>
              <input
                type="text"
                value={formData.floor_name}
                onChange={(e) => setFormData({ ...formData, floor_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., First Floor, Ground Floor"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
              <input
                type="number"
                value={formData.floor_number}
                onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 1, 2, 3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Programs (comma-separated)</label>
              <textarea
                value={formData.assigned_programs}
                onChange={(e) => setFormData({ ...formData, assigned_programs: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., BCA, MCA, B.Tech CSE"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional notes about this floor"
                rows={2}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all"
              >
                {isEditing ? 'Update Floor' : 'Create Floor'}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
