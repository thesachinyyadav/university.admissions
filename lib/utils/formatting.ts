/**
 * Data Formatting Utilities
 * Professional formatting functions for display and input
 */

// Sanitize phone number - extract last 10 digits (for Indian mobile numbers)
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Extract last 10 digits (handles formats like "-8861330574")
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(-10);
  }
  
  // Return as-is if less than 10 digits
  return digitsOnly;
}

// Format phone number for display (Indian format)
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format as +91 XXXXX-XXXXX for 10-digit numbers
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`;
  }
  
  // Format as +XX XXXXX-XXXXX for 11-12 digit numbers
  if (digitsOnly.length === 11 || digitsOnly.length === 12) {
    const countryCode = digitsOnly.slice(0, digitsOnly.length - 10);
    const number = digitsOnly.slice(-10);
    return `+${countryCode} ${number.slice(0, 5)}-${number.slice(5)}`;
  }
  
  // Return as-is if doesn't match expected format
  return phone;
}

// Format date for display
export function formatDate(dateString: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '';
  
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  };
  
  const options = formatOptions[format];
  
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

// Format date range
export function formatDateRange(from: string | Date, to: string | Date): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return '';
  
  // If same date, show only once
  if (fromDate.toDateString() === toDate.toDateString()) {
    return formatDate(from, 'short');
  }
  
  return `${formatDate(from, 'short')} - ${formatDate(to, 'short')}`;
}

// Format time
export function formatTime(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

// Format date and time
export function formatDateTime(dateString: string | Date): string {
  return `${formatDate(dateString, 'short')} at ${formatTime(dateString)}`;
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format number with Indian number system (lakhs, crores)
export function formatNumberIndian(num: number): string {
  if (num === null || num === undefined) return '';
  
  return new Intl.NumberFormat('en-IN').format(num);
}

// Format currency (INR)
export function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - 3) + '...';
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isNaN(date.getTime())) return '';
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

// Generate initials from name
export function getInitials(name: string): string {
  if (!name) return '';
  
  const words = name.trim().split(' ');
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

// Format QR color based on category
export function getQRColor(category: 'student' | 'speaker' | 'vip'): string {
  const colors = {
    student: '#1e40af', // Blue
    speaker: '#d97706', // Amber
    vip: '#991b1b'      // Maroon
  };
  
  return colors[category] || colors.student;
}

// Slugify text (convert to URL-friendly format)
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

// Parse query string
export function parseQueryString(queryString: string): Record<string, string> {
  if (!queryString) return {};
  
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 0): string {
  if (value === null || value === undefined) return '0%';
  
  return `${value.toFixed(decimals)}%`;
}

// Clean and normalize text input
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/[\r\n]+/g, ' '); // Replace newlines with space
}
