export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError, DatabaseError } from "@/lib/logger"
import { followRepository } from "@/server/repositories/followRepository"
import { prisma } from "@/server/db"

// GET /api/follows?userId=xxx&type=followers|following
export async function GET(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Follow list fetch request received');

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") || "followers" // followers or following
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let follows
    if (type === "followers") {
      follows = await followRepository.findFollowers(userId, limit)
    } else {
      follows = await followRepository.findFollowing(userId, limit)
    }

    const users = follows
      .map(follow => {
        if (type === "followers") {
          return (follow as any).follower
        } else {
          return (follow as any).following
        }
      })
      .filter(u => u !== null)

    Logger.i(LogTags.AUTH, `Fetched ${users.length} ${type}`)
    return NextResponse.json({ users, count: users.length })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, `Failed to fetch follows`, { error: categorizedError })
    return NextResponse.json({ error: "Failed to fetch follow list" }, { status: 500 })
  }
}

// POST /api/follows - Follow a user
export async function POST(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Follow user request received');

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      Logger.w(LogTags.AUTH, 'Follow request failed: unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body // User to follow

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Can't follow yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await followRepository.isFollowing(session.user.id, userId)
    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 })
    }

    // Create follow relationship
    const follow = await followRepository.create(session.user.id, userId)

    if (!follow) {
      return NextResponse.json({ error: "Failed to create follow relationship" }, { status: 500 })
    }

    // Update follower and following counts
    await Promise.all([
      prisma.userStats.update({
        where: { userId: session.user.id },
        data: { followingCount: { increment: 1 } }
      }),
      prisma.userStats.update({
        where: { userId },
        data: { followerCount: { increment: 1 } }
      })
    ])

    Logger.i(LogTags.AUTH, `User ${session.user.id} followed user ${userId}`)
    return NextResponse.json({ message: "Successfully followed user", follow }, { status: 201 })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to follow user', { error: categorizedError })
    
    if (categorizedError instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }
    
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
  }
}

// DELETE /api/follows?userId=xxx - Unfollow a user
export async function DELETE(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Unfollow user request received');

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      Logger.w(LogTags.AUTH, 'Unfollow request failed: unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Delete follow relationship
    const result = await followRepository.delete(session.user.id, userId)

    if (!result) {
      return NextResponse.json({ error: "Follow relationship not found" }, { status: 404 })
    }

    // Update follower and following counts
    await Promise.all([
      prisma.userStats.update({
        where: { userId: session.user.id },
        data: { followingCount: { increment: -1 } }
      }),
      prisma.userStats.update({
        where: { userId },
        data: { followerCount: { increment: -1 } }
      })
    ])

    Logger.i(LogTags.AUTH, `User ${session.user.id} unfollowed user ${userId}`)
    return NextResponse.json({ message: "Successfully unfollowed user" })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to unfollow user', { error: categorizedError })
    
    if (categorizedError instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }
    
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
  }
}
