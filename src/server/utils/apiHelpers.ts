import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-config/auth";
import { Logger, LogTags } from "@/lib/logger";
import { userRepository } from "@/server/repositories/userRepository";

/**
 * Get authenticated user from session
 * Returns user ID or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * Require authentication middleware
 * Returns user ID or throws error response
 */
export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    Logger.w(LogTags.AUTH, 'Unauthorized access attempt');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return { userId: session.user.id };
}

/**
 * Update user statistics after content changes
 */
export async function updateUserStats(
  userId: string,
  updates: Partial<{
    totalPhotos: number;
    totalVideos: number;
    totalJournals: number;
  }>
) {
  try {
    const updateData: any = {
      stats: {
        update: {
          lastActive: new Date(),
          ...(updates.totalPhotos !== undefined && { totalPhotos: updates.totalPhotos }),
          ...(updates.totalVideos !== undefined && { totalVideos: updates.totalVideos }),
          ...(updates.totalJournals !== undefined && { totalJournals: updates.totalJournals })
        }
      }
    };

    await userRepository.update(userId, updateData);
    Logger.d(LogTags.USER_UPDATE, 'User stats updated', { userId, updates });
  } catch (error) {
    Logger.e(LogTags.USER_UPDATE, 'Failed to update user stats', { error, userId });
  }
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Build common query filters for content
 */
export function buildContentQuery(
  searchParams: URLSearchParams,
  userId?: string | null
): Record<string, any> {
  const query: Record<string, any> = {};
  
  // Only filter by isPublic if not fetching user's own content
  if (!userId) {
    query.isPublic = true;
  }
  
  return query;
}

/**
 * Create standardized success response
 */
export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Create standardized error response
 */
export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Validate ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Common populate options for user references
 */
export const USER_POPULATE_OPTIONS = "name avatar email";

/**
 * Exclude password from user document
 */
export const USER_SAFE_SELECT = "-password";
