import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { prisma } from "@/server/db"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError, DatabaseError } from "@/lib/logger"

interface MoodFrequency {
  mood: string
  count: number
}

interface MonthlyActivity {
  month: string
  photos: number
  videos: number
  journals: number
  total: number
}

interface InsightsData {
  currentMonth: {
    total: number
    photos: number
    videos: number
    journals: number
  }
  longestStreak: number
  currentStreak: number
  moodFrequency: MoodFrequency[]
  monthlyActivity: MonthlyActivity[]
  totalMemories: number
  favoriteTag?: string
  mostProductiveMonth?: string
  averagePostsPerMonth: number
}

export async function GET(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Memory insights request received')

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    Logger.d(LogTags.AUTH, 'Generating insights for user', { userId })

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Current month activity
    const [currentMonthPhotos, currentMonthVideos, currentMonthJournals] = await Promise.all([
      prisma.photo.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.video.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.journal.count({
        where: {
          authorId: userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      })
    ])

    const currentMonthTotal = currentMonthPhotos + currentMonthVideos + currentMonthJournals

    // Total memories
    const [totalPhotos, totalVideos, totalJournals] = await Promise.all([
      prisma.photo.count({ where: { userId } }),
      prisma.video.count({ where: { userId } }),
      prisma.journal.count({ where: { authorId: userId } })
    ])

    const totalMemories = totalPhotos + totalVideos + totalJournals

    // Mood frequency from journals
    const journals = await prisma.journal.findMany({
      where: {
        authorId: userId,
        mood: { not: null }
      },
      select: { mood: true }
    })

    const moodMap = new Map<string, number>()
    journals.forEach((j: typeof journals[0]) => {
      if (j.mood) {
        moodMap.set(j.mood, (moodMap.get(j.mood) || 0) + 1)
      }
    })

    const moodFrequency: MoodFrequency[] = Array.from(moodMap)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate streaks from all activity
    const [allPhotos, allVideos, allJournals] = await Promise.all([
      prisma.photo.findMany({
        where: { userId },
        select: { createdAt: true }
      }),
      prisma.video.findMany({
        where: { userId },
        select: { createdAt: true }
      }),
      prisma.journal.findMany({
        where: { authorId: userId },
        select: { createdAt: true }
      })
    ])

    const allDates = [
      ...allPhotos.map((a: typeof allPhotos[0]) => a.createdAt),
      ...allVideos.map((a: typeof allVideos[0]) => a.createdAt),
      ...allJournals.map((a: typeof allJournals[0]) => a.createdAt)
    ]
      .map(d => d.toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort()
      .reverse()

    // Calculate streaks
    let currentStreak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (allDates.length > 0 && (allDates.includes(today) || allDates.includes(yesterday))) {
      let checkDate = allDates.includes(today) ? today : yesterday
      for (const date of allDates) {
        if (date === checkDate) {
          currentStreak++
          const dateObj = new Date(checkDate)
          dateObj.setDate(dateObj.getDate() - 1)
          checkDate = dateObj.toISOString().split('T')[0]
        } else if (date < checkDate) {
          break
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 1

    for (let i = 0; i < allDates.length - 1; i++) {
      const current = new Date(allDates[i])
      const next = new Date(allDates[i + 1])
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    // Monthly activity for last 12 months
    const monthlyActivity: MonthlyActivity[] = []
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      
      const [photos, videos, journals] = await Promise.all([
        prisma.photo.count({
          where: {
            userId,
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.video.count({
          where: {
            userId,
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.journal.count({
          where: {
            authorId: userId,
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        })
      ])

      monthlyActivity.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        photos,
        videos,
        journals,
        total: photos + videos + journals
      })
    }

    // Find most productive month
    const mostProductiveMonth = monthlyActivity.reduce((max, month) => 
      month.total > max.total ? month : max
    , monthlyActivity[0])

    // Average posts per month
    const averagePostsPerMonth = Math.round(
      monthlyActivity.reduce((sum, m) => sum + m.total, 0) / monthlyActivity.length
    )

    // Get tags from content
    const photoWithTags = await prisma.photo.findMany({
      where: { userId },
      select: { tags: true }
    })

    const videoWithTags = await prisma.video.findMany({
      where: { userId },
      select: { tags: true }
    })

    const allTags = new Map<string, number>()
    ;[...photoWithTags, ...videoWithTags].forEach((content: any) => {
      if (content.tags && Array.isArray(content.tags)) {
        content.tags.forEach((tag: string) => {
          allTags.set(tag, (allTags.get(tag) || 0) + 1)
        })
      }
    })

    const favoriteTag = allTags.size > 0
      ? Array.from(allTags).sort((a, b) => b[1] - a[1])[0][0]
      : undefined

    const insights: InsightsData = {
      currentMonth: {
        total: currentMonthTotal,
        photos: currentMonthPhotos,
        videos: currentMonthVideos,
        journals: currentMonthJournals
      },
      longestStreak,
      currentStreak,
      moodFrequency,
      monthlyActivity,
      totalMemories,
      favoriteTag,
      mostProductiveMonth: mostProductiveMonth?.month,
      averagePostsPerMonth
    }

    Logger.i(LogTags.AUTH, 'Memory insights generated successfully')
    
    return NextResponse.json(insights)
  } catch (error) {
    const categorizedError = categorizeError(error)

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in insights: ${categorizedError.message}`)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    Logger.e(LogTags.AUTH, `Unexpected error in insights: ${categorizedError.message}`, { error: categorizedError })
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
