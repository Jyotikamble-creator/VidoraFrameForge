import type { Comment as PrismaComment } from "@prisma/client"

/**
 * PostgreSQL/Prisma-compatible comment contract.
 * This replaces the legacy Mongoose model shape.
 */
export interface IComment extends PrismaComment {
  user?: {
    id: string
    username?: string
    email?: string
    avatar?: string | null
  }
  replies?: IComment[]
}

export type ContentTypeModel = "Video" | "Photo" | "Journal"

export function getContentTypeModel(contentType: IComment["contentType"]): ContentTypeModel {
  switch (contentType) {
    case "video":
      return "Video"
    case "photo":
      return "Photo"
    case "journal":
      return "Journal"
    default:
      return "Video"
  }
}

export function getLikeCount(comment: IComment): number {
  return comment.likes ?? 0
}

// Legacy default export kept to avoid breaking imports while migrating from Mongoose.
const Comment = {} as const
export default Comment
