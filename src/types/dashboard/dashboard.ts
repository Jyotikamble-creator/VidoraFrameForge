export interface UserVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  uploadedAt: Date;
  visibility: "Public" | "Private" | "Unlisted";
  duration?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}