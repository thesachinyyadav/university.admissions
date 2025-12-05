/**
 * Form Validation Utilities
 * Professional validation functions for Christ University Gated Access System
 */

// Email validation
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
}

// Phone number validation (supports Indian format)
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's 10 digits (Indian mobile) or 11-12 digits (with country code)
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }
  
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }
  
  return { isValid: true };
}

// Name validation
export function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' };
  }
  
  // Check if name contains only letters, spaces, and common name characters
  const nameRegex = /^[a-zA-Z\s'.-]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, and common punctuation' };
  }
  
  return { isValid: true };
}

// Register number validation (university ID)
export function validateRegisterNumber(regNumber: string): { isValid: boolean; error?: string } {
  if (!regNumber) {
    return { isValid: false, error: 'Register number is required' };
  }
  
  if (regNumber.trim().length < 5) {
    return { isValid: false, error: 'Register number must be at least 5 characters' };
  }
  
  if (regNumber.trim().length > 20) {
    return { isValid: false, error: 'Register number is too long' };
  }
  
  return { isValid: true };
}

// Date validation
export function validateDate(dateString: string): { isValid: boolean; error?: string } {
  if (!dateString) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
  
  return { isValid: true };
}

// Date range validation (from must be before to)
export function validateDateRange(from: string, to: string): { isValid: boolean; error?: string } {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { isValid: false, error: 'Please enter valid dates' };
  }
  
  if (fromDate > toDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }
  
  return { isValid: true };
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }
  
  let strength = 0;
  
  // Check for lowercase
  if (/[a-z]/.test(password)) strength++;
  
  // Check for uppercase
  if (/[A-Z]/.test(password)) strength++;
  
  // Check for numbers
  if (/[0-9]/.test(password)) strength++;
  
  // Check for special characters
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters',
      strength: 'weak'
    };
  }
  
  const strengthLevel = strength === 4 ? 'strong' : strength === 3 ? 'medium' : 'weak';
  
  return { isValid: true, strength: strengthLevel };
}

// Generic required field validation
export function validateRequired(value: string, fieldName: string = 'Field'): { isValid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
}

// Number validation
export function validateNumber(value: string, min?: number, max?: number): { isValid: boolean; error?: string } {
  if (!value) {
    return { isValid: false, error: 'Value is required' };
  }
  
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Value must not exceed ${max}` };
  }
  
  return { isValid: true };
}

// URL validation
export function validateURL(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

// Generic form validation helper
export function validateForm(fields: Record<string, any>, rules: Record<string, (value: any) => { isValid: boolean; error?: string }>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const rule = rules[fieldName];
    if (rule) {
      const result = rule(value);
      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
