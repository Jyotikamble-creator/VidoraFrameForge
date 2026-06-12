'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '@/ui/Loader'
import { Logger, LogTags } from '@/lib/logger'
import { 
  TrendingUp, 
  Calendar, 
  Smile, 
  Award, 
  BarChart3,
  Download,
  Target,
  Tag,
  Activity
} from 'lucide-react'

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

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/insights')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      setInsights(data)
      Logger.i(LogTags.AUTH, 'Insights loaded successfully')
    } catch (err) {
      Logger.e(LogTags.AUTH, 'Failed to fetch insights', { error: err })
      setError('Failed to load insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      excited: '🤩',
      calm: '😌',
      anxious: '😰',
      grateful: '🙏',
      inspired: '✨',
      tired: '😴',
      motivated: '💪',
      content: '😊',
      stressed: '😫',
      peaceful: '☮️',
      angry: '😠',
      joyful: '😄',
      reflective: '🤔'
    }
    return moodMap[mood.toLowerCase()] || '💭'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (error || !insights) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || 'No insights available'}</p>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const maxMonthlyTotal = Math.max(...insights.monthlyActivity.map(m => m.total))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Memory Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover patterns in your memories and track your journey
            </p>
          </div>
          <button
            onClick={() => router.push('/export')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Reports
          </button>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* This Month */}
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{insights.currentMonth.total}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">This Month</h3>
            <p className="text-sm opacity-90">
              {insights.currentMonth.photos} photos, {insights.currentMonth.videos} videos, {insights.currentMonth.journals} journals
            </p>
          </div>

          {/* Longest Streak */}
          <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{insights.longestStreak}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Longest Streak</h3>
            <p className="text-sm opacity-90">
              {insights.currentStreak > 0 
                ? `Current: ${insights.currentStreak} ${insights.currentStreak === 1 ? 'day' : 'days'}`
                : 'Keep posting to build a streak!'
              }
            </p>
          </div>

          {/* Total Memories */}
          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{insights.totalMemories}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Memories</h3>
            <p className="text-sm opacity-90">
              Avg {insights.averagePostsPerMonth}/month
            </p>
          </div>

          {/* Favorite Tag */}
          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Tag className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">#{insights.favoriteTag || 'N/A'}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Favorite Tag</h3>
            <p className="text-sm opacity-90">
              {insights.mostProductiveMonth ? `Peak: ${insights.mostProductiveMonth}` : 'Most used across all content'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Frequency Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center mb-6">
            <Smile className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Mood Frequency
            </h2>
          </div>
          
          {insights.moodFrequency.length === 0 ? (
            <div className="text-center py-12">
              <Smile className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                Add moods to your journals to see insights here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.moodFrequency.map((mood, index) => {
                const maxCount = insights.moodFrequency[0].count
                const percentage = (mood.count / maxCount) * 100
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-2xl">{getMoodEmoji(mood.mood)}</span>
                        <span className="font-medium capitalize">{mood.mood}</span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">{mood.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-linear-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Monthly Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              12-Month Activity
            </h2>
          </div>
          
          <div className="space-y-2">
            {insights.monthlyActivity.map((month, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    {month.month}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {month.total} total
                  </span>
                </div>
                <div className="flex gap-0.5 h-6">
                  {/* Photos */}
                  <div
                    className="bg-blue-500 rounded-l transition-all duration-300 hover:opacity-80 relative group"
                    style={{ width: `${(month.photos / maxMonthlyTotal) * 100}%` }}
                    title={`${month.photos} photos`}
                  >
                    {month.photos > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium opacity-0 group-hover:opacity-100">
                        {month.photos}P
                      </span>
                    )}
                  </div>
                  {/* Videos */}
                  <div
                    className="bg-purple-500 transition-all duration-300 hover:opacity-80 relative group"
                    style={{ width: `${(month.videos / maxMonthlyTotal) * 100}%` }}
                    title={`${month.videos} videos`}
                  >
                    {month.videos > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium opacity-0 group-hover:opacity-100">
                        {month.videos}V
                      </span>
                    )}
                  </div>
                  {/* Journals */}
                  <div
                    className="bg-green-500 rounded-r transition-all duration-300 hover:opacity-80 relative group"
                    style={{ width: `${(month.journals / maxMonthlyTotal) * 100}%` }}
                    title={`${month.journals} journals`}
                  >
                    {month.journals > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium opacity-0 group-hover:opacity-100">
                        {month.journals}J
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Videos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Journals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-indigo-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Quick Stats
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{insights.currentMonth.photos}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Photos This Month</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">{insights.currentMonth.videos}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Videos This Month</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-500">{insights.currentMonth.journals}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Journals This Month</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{insights.averagePostsPerMonth}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg Per Month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
