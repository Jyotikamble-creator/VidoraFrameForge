// Makes forms and API calls type-safe
export interface Transformation {
  width?: number;
  height?: number;
  quality?: number;
}

export interface Video {
  _id?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  controls?: boolean;
  transformation?: Transformation;
  createdAt?: string;
  views?: number;
  likes?: number;
  uploader?: string;
}
