import type { Video as PrismaVideo } from "@prisma/client"

export const VIDEO_DIMENSIONS = {
  width: 1920, // Fixed order
  height: 1080,
} as const

/**
 * PostgreSQL/Prisma-compatible video contract.
 * Includes optional legacy fields still consumed by UI code.
 */
export interface IVideo extends PrismaVideo {
  _id?: string
  videoUrl?: string
  thumbnailUrl?: string
  uploader?: {
    id?: string
    _id?: string
    name?: string
    username?: string
    email?: string
    avatar?: string | null
  }
  user?: {
    id: string
    username?: string
    email?: string
    avatar?: string | null
    stats?: {
      followerCount?: number
    } | null
  }
  views?: number
  likes?: number
  commentCount?: number
  album?: string
  location?: string
  takenAt?: Date
  isPublic?: boolean // Deprecated, kept for backward compatibility
  fileId?: string
  fileName?: string
  size?: number
  controls?: boolean
  transformation?: {
    height: number
    width: number
    quality?: number
  }
}

export function isVideoPublic(video: IVideo): boolean {
  if (typeof video.isPublic === "boolean") return video.isPublic
  return video.privacy === "public"
}

export function getVideoId(video: IVideo): string {
  return video.id || video._id || ""
}

// Legacy default export kept to avoid breaking imports while migrating from Mongoose.
const Video = {} as const
export default Video
