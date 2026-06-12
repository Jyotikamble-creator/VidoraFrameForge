export interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  uploader: {
    _id: string;
    name: string;
    email: string;
    subscribers?: number;
  };
  creator?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    subscribers?: number;
  };
  views?: number;
  likes?: number;
  createdAt: Date;
  updatedAt: Date;
  uploadedAt?: Date;
  tags?: string[];
  category?: string;
  comments?: Comment[];
}

export interface Comment {
  _id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  likes: number;
  postedAt: Date;
  replies?: Comment[];
}

export interface RelatedVideo {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  thumbnail?: string;
  videoUrl?: string;
  creator: string;
  uploader?: {
    _id: string;
    name: string;
    email: string;
  };
  views: number;
  likes?: number;
  uploadedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  category?: string;
  comments?: Comment[];
}