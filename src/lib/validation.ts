/**
 * Validation utilities for VidoraFrameForge
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate video title
 */
export function isValidVideoTitle(title: string): boolean {
  return title.trim().length >= 1 && title.trim().length <= 100;
}

/**
 * Validate video description
 */
export function isValidVideoDescription(description: string): boolean {
  return description.trim().length <= 1000; // Optional field, but limit length
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSize: number = 100 * 1024 * 1024): boolean { // 100MB default
  return size > 0 && size <= maxSize;
}

/**
 * Validate video file type
 */
export function isValidVideoFileType(mimeType: string): boolean {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
  return validTypes.includes(mimeType);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}