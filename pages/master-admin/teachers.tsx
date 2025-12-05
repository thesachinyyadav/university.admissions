import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Modal } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Teacher {
  teacher_id: string;
  name: string;
  email: string | null;
  department: string | null;
  specialization: string | null;
  is_active: boolean;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function TeachersManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    specialization: '',
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
    fetchTeachers();
  }, [router]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers/list');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      department: '',
      specialization: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setNotification({
        type: 'error',
        message: 'Teacher name is required',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/teachers/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Teacher added successfully',
        });
        setIsModalOpen(false);
        fetchTeachers();
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to add teacher',
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Teachers Management</h1>
            <p className="text-gray-600">Manage interview panel teachers</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md"
          >
            + Add Teacher
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Specialization</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      No teachers added yet. Click "Add Teacher" to get started.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.teacher_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{teacher.name}</td>
                      <td className="py-4 px-4">{teacher.email || 'N/A'}</td>
                      <td className="py-4 px-4">{teacher.department || 'N/A'}</td>
                      <td className="py-4 px-4">{teacher.specialization || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Teacher"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Dr. Rajesh Kumar"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., rajesh.kumar@christuniversity.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Artificial Intelligence"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all"
              >
                Add Teacher
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
