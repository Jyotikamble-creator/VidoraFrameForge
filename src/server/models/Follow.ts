import type { Follow as PrismaFollow } from "@prisma/client"

/**
 * PostgreSQL/Prisma-compatible follow contract.
 */
export interface IFollow extends PrismaFollow {
  follower?: {
    id: string
    username?: string
    email?: string
    avatar?: string | null
  }
  following?: {
    id: string
    username?: string
    email?: string
    avatar?: string | null
  }
}

export function getFollowKey(followerId: string, followingId: string): string {
  return `${followerId}:${followingId}`
}

// Legacy default export kept to avoid breaking imports while migrating from Mongoose.
const Follow = {} as const
export default Follow
