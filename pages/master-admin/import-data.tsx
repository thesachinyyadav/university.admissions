import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

interface ParsedApplicant {
  application_number: string;
  name: string;
  phone: string;
  program: string;
  campus: string;
  date: string;
  time: string;
  location: string;
  instructions: string;
}

interface ImportError {
  row: number;
  field: string;
  error: string;
  value: any;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ImportData() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedApplicant[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);

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
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type)) {
      setNotification({
        type: 'error',
        message: 'Please upload a valid Excel file (.xls or .xlsx)',
      });
      return;
    }

    setSelectedFile(file);
    parseExcelFile(file);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const parsed: ParsedApplicant[] = jsonData.map((row: any) => ({
          application_number: String(row['Application Number'] || row['application_number'] || '').trim(),
          name: String(row['Name'] || row['name'] || '').trim(),
          phone: String(row['Phone'] || row['phone'] || row['Mobile'] || '').trim(),
          program: String(row['Program'] || row['program'] || row['Course'] || '').trim(),
          campus: String(row['Campus'] || row['campus'] || '').trim(),
          date: String(row['Date'] || row['date'] || '').trim(),
          time: String(row['Time'] || row['time'] || '').trim(),
          location: String(row['Location'] || row['location'] || '').trim(),
          instructions: String(row['Instructions'] || row['instructions'] || '').trim(),
        }));

        setParsedData(parsed);
        validateData(parsed);

        setNotification({
          type: 'success',
          message: `Successfully parsed ${parsed.length} records from Excel file`,
        });
      } catch (error) {
        setNotification({
          type: 'error',
          message: 'Failed to parse Excel file. Please check the format.',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateData = (data: ParsedApplicant[]) => {
    const errors: ImportError[] = [];
    const seenNumbers = new Set<string>();

    data.forEach((applicant, index) => {
      const rowNum = index + 2; // +2 because Excel starts at 1 and has header row

      if (!applicant.application_number) {
        errors.push({
          row: rowNum,
          field: 'application_number',
          error: 'Application number is required',
          value: applicant.application_number,
        });
      } else if (seenNumbers.has(applicant.application_number)) {
        errors.push({
          row: rowNum,
          field: 'application_number',
          error: 'Duplicate application number in file',
          value: applicant.application_number,
        });
      } else {
        seenNumbers.add(applicant.application_number);
      }

      if (!applicant.name) {
        errors.push({
          row: rowNum,
          field: 'name',
          error: 'Name is required',
          value: applicant.name,
        });
      }

      if (!applicant.phone) {
        errors.push({
          row: rowNum,
          field: 'phone',
          error: 'Phone number is required',
          value: applicant.phone,
        });
      } else {
        const sanitized = applicant.phone.replace(/\D/g, '');
        if (sanitized.length < 10) {
          errors.push({
            row: rowNum,
            field: 'phone',
            error: 'Phone number must have at least 10 digits',
            value: applicant.phone,
          });
        }
      }

      if (!applicant.program) {
        errors.push({
          row: rowNum,
          field: 'program',
          error: 'Program is required',
          value: applicant.program,
        });
      }

      if (!applicant.date) {
        errors.push({
          row: rowNum,
          field: 'date',
          error: 'Date is required',
          value: applicant.date,
        });
      }

      if (!applicant.time) {
        errors.push({
          row: rowNum,
          field: 'time',
          error: 'Time is required',
          value: applicant.time,
        });
      }
    });

    setValidationErrors(errors);
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      setNotification({
        type: 'error',
        message: `Cannot import data with ${validationErrors.length} validation errors`,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImportSummary(null);

    try {
      const chunkSize = 100;
      const chunks = [];

      for (let i = 0; i < parsedData.length; i += chunkSize) {
        chunks.push(parsedData.slice(i, i + chunkSize));
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const response = await fetch('/api/admin/import-applicants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicants: chunks[i] }),
        });

        const result = await response.json();

        if (response.ok) {
          successCount += result.success || 0;
          if (result.errors && result.errors.length > 0) {
            errorCount += result.errors.length;
            errors.push(...result.errors);
          }
        } else {
          errorCount += chunks[i].length;
          errors.push({ message: result.message || 'Chunk failed' });
        }

        setUploadProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      setImportSummary({
        total: parsedData.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors,
      });

      setNotification({
        type: successCount > 0 ? 'success' : 'error',
        message: `Import completed: ${successCount} successful, ${errorCount} failed`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error during import. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!importSummary || importSummary.errorDetails.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(importSummary.errorDetails);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');
    XLSX.writeFile(workbook, 'import-errors.xlsx');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportSummary(null);
    setUploadProgress(0);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Import Applicant Data</h1>
          <p className="text-gray-600">Upload Excel file to bulk import applicants</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload File</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {!selectedFile ? (
                  <div>
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-gray-700 font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-500 text-sm">Excel files (.xls, .xlsx) only</p>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block mt-4 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg cursor-pointer hover:bg-primary-700 transition-colors"
                    >
                      Select File
                    </label>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-16 w-16 text-green-500 mb-4"
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
                    <p className="text-gray-700 font-medium mb-2">{selectedFile.name}</p>
                    <p className="text-gray-500 text-sm mb-4">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Choose Different File
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {parsedData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Preview (First 10 Rows)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2">App #</th>
                        <th className="text-left py-3 px-2">Name</th>
                        <th className="text-left py-3 px-2">Phone</th>
                        <th className="text-left py-3 px-2">Program</th>
                        <th className="text-left py-3 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 10).map((applicant, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-2">{applicant.application_number}</td>
                          <td className="py-2 px-2">{applicant.name}</td>
                          <td className="py-2 px-2">{applicant.phone}</td>
                          <td className="py-2 px-2">{applicant.program}</td>
                          <td className="py-2 px-2">{applicant.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 mt-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Uploading...</h2>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-primary-600 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              </motion.div>
            )}

            {importSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 mt-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Import Summary</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{importSummary.total}</p>
                    <p className="text-gray-600">Total Records</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{importSummary.success}</p>
                    <p className="text-gray-600">Successful</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{importSummary.errors}</p>
                    <p className="text-gray-600">Failed</p>
                  </div>
                </div>
                {importSummary.errorDetails.length > 0 && (
                  <button
                    onClick={downloadErrorReport}
                    className="w-full px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Download Error Report
                  </button>
                )}
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Records</span>
                  <span className="text-2xl font-bold text-gray-800">{parsedData.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Validation Errors</span>
                  <span
                    className={`text-2xl font-bold ${
                      validationErrors.length === 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {validationErrors.length}
                  </span>
                </div>
              </div>
            </motion.div>

            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-lg p-6 mb-6"
              >
                <h3 className="text-xl font-bold text-red-600 mb-4">Validation Errors</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {validationErrors.slice(0, 20).map((error, idx) => (
                    <div key={idx} className="p-3 bg-red-50 rounded text-sm">
                      <p className="font-medium text-red-700">
                        Row {error.row}: {error.field}
                      </p>
                      <p className="text-red-600">{error.error}</p>
                    </div>
                  ))}
                  {validationErrors.length > 20 && (
                    <p className="text-gray-500 text-center">
                      ...and {validationErrors.length - 20} more errors
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {parsedData.length > 0 && !isUploading && !importSummary && (
              <button
                onClick={handleImport}
                disabled={validationErrors.length > 0}
                className={`w-full px-6 py-4 font-bold text-lg rounded-lg transition-all ${
                  validationErrors.length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg'
                }`}
              >
                Import {parsedData.length} Applicants
              </button>
            )}

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-blue-50 rounded-xl p-6 mt-6"
            >
              <h3 className="text-lg font-bold text-blue-800 mb-3">Excel Format Guide</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• <strong>Application Number</strong> (required)</li>
                <li>• <strong>Name</strong> (required)</li>
                <li>• <strong>Phone</strong> (required, 10 digits)</li>
                <li>• <strong>Program</strong> (required)</li>
                <li>• <strong>Campus</strong> (optional)</li>
                <li>• <strong>Date</strong> (required)</li>
                <li>• <strong>Time</strong> (required)</li>
                <li>• <strong>Location</strong> (optional)</li>
                <li>• <strong>Instructions</strong> (optional)</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
