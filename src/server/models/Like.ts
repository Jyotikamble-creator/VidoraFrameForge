import type { Like as PrismaLike } from "@prisma/client"

/**
 * PostgreSQL/Prisma-compatible like contract.
 */
export interface ILike extends PrismaLike {
  user?: {
    id: string
    username?: string
    email?: string
    avatar?: string | null
  }
}

export function getLikeKey(userId: string, contentType: string, contentId: string): string {
  return `${userId}:${contentType}:${contentId}`
}

// Legacy default export kept to avoid breaking imports while migrating from Mongoose.
const Like = {} as const
export default Like
