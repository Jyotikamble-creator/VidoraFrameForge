export const isValidVideoFile = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  return validTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeGB: number = 2): boolean => {
  const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};