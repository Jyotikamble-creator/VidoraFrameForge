export interface VideoUpload {
  file: File | null;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string | null;
  progress: number;
  isUploading: boolean;
}

export interface ThumbnailOption {
  id: string;
  url: string;
  selected: boolean;
}