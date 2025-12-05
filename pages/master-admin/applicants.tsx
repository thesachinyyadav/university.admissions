import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Modal } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

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
  assigned_panel_id: string | null;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ApplicantsManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    program: '',
    dateFrom: '',
    dateTo: '',
  });

  const statusOptions = [
    'REGISTERED',
    'ARRIVED',
    'DOCUMENT_VERIFIED',
    'INTERVIEW_IN_PROGRESS',
    'INTERVIEW_COMPLETED',
  ];

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
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchApplicants();
    }
  }, [user, page, filters]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchApplicants = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.program && { program: filters.program }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/admin/applicants/list?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setApplicants(data.applicants);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.program && { program: filters.program }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/admin/applicants/export?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        const worksheet = XLSX.utils.json_to_sheet(data.applicants);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants');
        XLSX.writeFile(workbook, `applicants-export-${new Date().toISOString().split('T')[0]}.xlsx`);

        setNotification({
          type: 'success',
          message: `Exported ${data.applicants.length} applicants to Excel`,
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to export data',
      });
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApplicant) return;

    try {
      const response = await fetch('/api/admin/applicants/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_number: selectedApplicant.application_number,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Status updated successfully',
        });
        setIsDetailsModalOpen(false);
        fetchApplicants();
      } else {
        const data = await response.json();
        setNotification({
          type: 'error',
          message: data.message || 'Failed to update status',
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error',
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-gray-100 text-gray-700';
      case 'ARRIVED':
        return 'bg-blue-100 text-blue-700';
      case 'DOCUMENT_VERIFIED':
        return 'bg-green-100 text-green-700';
      case 'INTERVIEW_IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-700';
      case 'INTERVIEW_COMPLETED':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalPages = Math.ceil(total / limit);

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
            <div
              className={`px-6 py-4 rounded-lg shadow-lg text-white ${
                notification.type === 'success'
                  ? 'bg-green-500'
                  : notification.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
            >
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">All Applicants</h1>
            <p className="text-gray-600">Manage and track all applicants</p>
          </div>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md"
          >
            Export to Excel
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by App # or Name"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Program (e.g., BCA)"
              value={filters.program}
              onChange={(e) => handleFilterChange('program', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">App #</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Program</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Campus</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Time</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : applicants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No applicants found
                    </td>
                  </tr>
                ) : (
                  applicants.map((applicant) => (
                    <tr key={applicant.application_number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{applicant.application_number}</td>
                      <td className="py-4 px-4">{applicant.name}</td>
                      <td className="py-4 px-4">{applicant.program}</td>
                      <td className="py-4 px-4">{applicant.campus || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(applicant.status)}`}>
                          {applicant.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">{applicant.date}</td>
                      <td className="py-4 px-4">{applicant.time}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => {
                            setSelectedApplicant(applicant);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-4 py-2 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded ${page === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {isDetailsModalOpen && selectedApplicant && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Applicant Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Application Number</p>
                <p className="font-medium">{selectedApplicant.application_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedApplicant.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{selectedApplicant.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium">{selectedApplicant.program}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Campus</p>
                <p className="font-medium">{selectedApplicant.campus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">{selectedApplicant.date} {selectedApplicant.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{selectedApplicant.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedApplicant.status)}`}>
                  {selectedApplicant.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {selectedApplicant.instructions && (
              <div>
                <p className="text-sm text-gray-500">Instructions</p>
                <p className="font-medium">{selectedApplicant.instructions}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-bold mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={status === selectedApplicant.status}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      status === selectedApplicant.status
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
