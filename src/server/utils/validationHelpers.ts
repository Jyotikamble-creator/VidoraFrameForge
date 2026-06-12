/**
 * Common validation schemas for consistent data validation
 * Uses existing validation functions from lib/validation.ts
 */

import { sanitizeString, isValidEmail, isValidPassword, isValidVideoTitle, isValidVideoDescription } from "@/lib/validation";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate user registration data
 */
export function validateUserRegistration(data: {
  name?: string;
  email?: string;
  password?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (data.name.trim().length > 50) {
    errors.name = "Name cannot exceed 50 characters";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (!isValidPassword(data.password)) {
    errors.password = "Password must be at least 6 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate video upload data
 */
export function validateVideoData(data: {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || !data.title.trim()) {
    errors.title = "Title is required";
  } else if (!isValidVideoTitle(data.title)) {
    errors.title = "Title must be between 1 and 100 characters";
  }

  if (data.description && !isValidVideoDescription(data.description)) {
    errors.description = "Description must be less than 1000 characters";
  }

  if (!data.videoUrl) {
    errors.videoUrl = "Video URL is required";
  }

  if (!data.thumbnailUrl) {
    errors.thumbnailUrl = "Thumbnail URL is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate photo upload data
 */
export function validatePhotoData(data: {
  photoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.photoUrl) {
    errors.photoUrl = "Photo URL is required";
  }

  if (!data.thumbnailUrl) {
    errors.thumbnailUrl = "Thumbnail URL is required";
  }

  if (data.title && !isValidVideoTitle(data.title)) {
    errors.title = "Title must be between 1 and 100 characters";
  }

  if (data.description && !isValidVideoDescription(data.description)) {
    errors.description = "Description must be less than 1000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate journal data
 */
export function validateJournalData(data: {
  title?: string;
  content?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || !data.title.trim()) {
    errors.title = "Title is required";
  } else if (!isValidVideoTitle(data.title)) {
    errors.title = "Title must be between 1 and 100 characters";
  }

  if (!data.content || !data.content.trim()) {
    errors.content = "Content is required";
  } else if (data.content.length > 10000) {
    errors.content = "Content must be less than 10,000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitize user input data
 */
export function sanitizeUserData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
