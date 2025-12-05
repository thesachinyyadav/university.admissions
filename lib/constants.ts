/**
 * Application Constants
 * Centralized configuration and constants for Christ University Gated Access System
 */

// QR Code Colors
export const QR_COLORS = {
  STUDENT: '#1e40af',  // Blue
  SPEAKER: '#d97706',  // Amber
  VIP: '#991b1b'       // Maroon
} as const;

// Visitor Categories
export const VISITOR_CATEGORIES = {
  STUDENT: 'student',
  SPEAKER: 'speaker',
  VIP: 'vip'
} as const;

// User Roles
export const USER_ROLES = {
  GUARD: 'guard',
  ORGANISER: 'organiser',
  CSO: 'cso'
} as const;

// Status Types
export const STATUS_TYPES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVOKED: 'revoked'
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  REGISTER_VISITOR: '/api/registerVisitor',
  VERIFY_VISITOR: '/api/verifyVisitor',
  APPROVED_EVENTS: '/api/approved-events',
  EVENT_REQUESTS: '/api/event-requests',
  CSO_APPROVE_EVENT: '/api/cso/approve-event',
  VISITORS: '/api/visitors',
  UPDATE_STATUS: '/api/updateStatus'
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme',
  PWA_INSTALL_PROMPT_SEEN: 'pwa-install-prompt-seen',
  FORM_DRAFT: 'form-draft'
} as const;

// Form Validation Rules
export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  REGISTER_NUMBER_MIN_LENGTH: 5,
  REGISTER_NUMBER_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_MAX_LENGTH: 255
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  PHOTO_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  PHOTO_ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  PHOTO_MAX_WIDTH: 1920,
  PHOTO_MAX_HEIGHT: 1080
} as const;

// QR Code Settings
export const QR_CODE_SETTINGS = {
  SIZE: 400,
  ERROR_CORRECTION_LEVEL: 'H',
  MARGIN: 4,
  PDF_SIZE: 86 // 86mm x 86mm
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10
} as const;

// Session Settings
export const SESSION = {
  TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_INTERVAL: 15 * 60 * 1000 // 15 minutes
} as const;

// Toast/Notification Settings
export const NOTIFICATION = {
  DURATION: 5000, // 5 seconds
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 7000
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const;

// Breakpoints (must match Tailwind config)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

// University Information
export const UNIVERSITY_INFO = {
  NAME: 'Christ University',
  FULL_NAME: 'Christ (Deemed to be University)',
  WEBSITE: 'https://christuniversity.in',
  SAFETY_POLICY_URL: 'https://christuniversity.in/view-pdf/safety-and-security-of-students-on-campus',
  SUPPORT_EMAIL: 'security@christuniversity.in',
  EMERGENCY_NUMBER: '080-4012-9100'
} as const;

// Feature Flags (can be controlled via env variables)
export const FEATURES = {
  PWA_ENABLED: true,
  OFFLINE_MODE: true,
  ANALYTICS_ENABLED: false,
  EMAIL_NOTIFICATIONS: false,
  PUSH_NOTIFICATIONS: false,
  DARK_MODE: false
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  APPROVAL_SUCCESS: 'Approved successfully!',
  QR_GENERATED: 'QR code generated successfully!'
} as const;

// Cache Settings
export const CACHE = {
  STATIC_ASSETS_VERSION: 'v1.0.0',
  API_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  IMAGE_CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 hours
} as const;

// Rate Limiting (for client-side throttling)
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,
  DEBOUNCE_DELAY: 300, // milliseconds
  THROTTLE_DELAY: 1000 // milliseconds
} as const;
