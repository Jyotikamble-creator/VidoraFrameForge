export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { Logger, LogTags, categorizeError, DatabaseError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'User stats request received');

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      Logger.w(LogTags.AUTH, 'User stats request failed: missing user ID');
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    Logger.d(LogTags.AUTH, 'Fetching stats for user', { userId });

    // Fetch user stats from UserStats table
    const stats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!stats) {
      Logger.w(LogTags.AUTH, 'User stats request failed: stats not found', { userId });
      return NextResponse.json({ error: "User stats not found" }, { status: 404 })
    }

    Logger.i(LogTags.AUTH, 'User stats fetched successfully', {
      userId,
      stats
    });

    return NextResponse.json({ stats })
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in user stats fetch: ${categorizedError.message}`);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.AUTH, `Unexpected error in user stats fetch: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}
