// Repository barrel export
// Import all repositories from a single location:
// import { userRepository, videoRepository, photoRepository } from '@/server/repositories'

export { userRepository } from "./userRepository"
export { videoRepository } from "./videoRepository"
export { photoRepository } from "./photoRepository"
export { journalRepository } from "./journalRepository"
export { likeRepository } from "./likeRepository"
export { commentRepository } from "./commentRepository"
export { followRepository } from "./followRepository"

// Re-export types/interfaces if needed
export type { UserFilters } from "./userRepository"
export type { VideoFilters } from "./videoRepository"
export type { PhotoFilters } from "./photoRepository"
export type { JournalFilters } from "./journalRepository"
export type { LikeFilters } from "./likeRepository"
export type { CommentFilters } from "./commentRepository"
export type { FollowFilters } from "./followRepository"
