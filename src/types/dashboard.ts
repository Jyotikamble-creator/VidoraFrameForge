export interface UserVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  videoUrl: string;
  duration?: string;
  views: number;
  likes?: number;
  uploadedAt: Date;
  visibility: 'Public' | 'Private' | 'Unlisted';
  status: 'processing' | 'ready' | 'failed';
}

export interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  subscriberCount?: number;
}