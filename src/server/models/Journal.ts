import type { Journal as PrismaJournal, JournalAttachment as PrismaJournalAttachment } from "@prisma/client"

export interface IJournalAttachment extends PrismaJournalAttachment {
  thumbnailUrl?: string
  fileId?: string
  fileName?: string
  size?: number
}

/**
 * PostgreSQL/Prisma-compatible journal contract.
 * Includes optional legacy fields still used by frontend code during migration.
 */
export interface IJournal extends PrismaJournal {
  author?: {
    id: string
    username?: string
    name?: string
    avatar?: string | null
    email?: string
  }
  tags?: string[]
  attachments?: IJournalAttachment[]
  isPublic?: boolean
  location?: string
  likes?: number
  commentCount?: number
}

export function isJournalPublic(journal: IJournal): boolean {
  if (typeof journal.isPublic === "boolean") return journal.isPublic
  return journal.privacy === "public"
}

// Legacy default export kept to avoid breaking imports while migrating from Mongoose.
const Journal = {} as const
export default Journal