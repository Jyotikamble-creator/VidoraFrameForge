export interface VideoUpload {
  id?: string;
  title: string;
  description: string;
  file?: File;
  thumbnail?: string;
  category: string;
  tags: string[];
  isUploading: boolean;
  progress: number;
}

export interface ThumbnailOption {
  id: string;
  url: string;
  isSelected: boolean;
}

export interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'processing' | 'complete' | 'error';
}