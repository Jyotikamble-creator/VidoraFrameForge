import type { Photo as PrismaPhoto } from "@prisma/client"

/**
 * PostgreSQL/Prisma-compatible photo contract.
 * Includes optional legacy fields still consumed by UI code.
 */
export interface IPhoto extends PrismaPhoto {
  user?: {
    id: string
    username?: string
    name?: string
    avatar?: string | null
    email?: string
  }
  uploader?: {
    id?: string
    _id?: string
    name?: string
    username?: string
    avatar?: string | null
    email?: string
  }
  thumbnailUrl?: string
  fileId?: string
  fileName?: string
  size?: number
  location?: string
  takenAt?: Date
  isPublic?: boolean
  views?: number
  likes?: number
  commentCount?: number
}

export function isPhotoPublic(photo: IPhoto): boolean {
  if (typeof photo.isPublic === "boolean") return photo.isPublic
  return photo.privacy === "public"
}

// Legacy default export kept to avoid breaking imports while migrating from Mongoose.
const Photo = {} as const
export default Photo