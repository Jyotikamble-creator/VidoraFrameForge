"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import VideoCard from "@/components/video/VideoCard"
import Loader from "@/ui/Loader"
import { IVideo } from "@/server/models/Video"
import { IPhoto } from "@/server/models/Photo"
import { IJournal } from "@/server/models/Journal"
import { exportUserDataToPDF } from "@/lib/utils/pdfExport"

interface UserStats {
  totalPhotos: number
  totalVideos: number
  totalJournals: number
  lastActive: Date
  streak: number
}

interface ActivityItem {
  id: string
  type: 'photo' | 'video' | 'journal'
  title: string
  createdAt: Date
  thumbnail?: string
}

function getEntityId(item: unknown): string {
  if (!item || typeof item !== "object") return ""

  const maybeWithId = item as { id?: string; _id?: string | { toString: () => string } }
  if (typeof maybeWithId.id === "string") return maybeWithId.id
  if (typeof maybeWithId._id === "string") return maybeWithId._id
  if (maybeWithId._id && typeof maybeWithId._id.toString === "function") {
    return maybeWithId._id.toString()
  }

  return ""
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth()
  const [videos, setVideos] = useState<IVideo[]>([])
  const [photos, setPhotos] = useState<IPhoto[]>([])
  const [journals, setJournals] = useState<IJournal[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Fetch videos
      fetchUserVideos()

      // Fetch user stats
      fetchUserStats()

      // Fetch recent activity
      fetchRecentActivity()
    }
  }, [isAuthenticated, user?.id, refreshKey]) // Added refreshKey dependency

  const fetchUserVideos = async () => {
    try {
      setVideosLoading(true)
      console.log('Fetching videos for user:', user?.id)
      const response = await fetch(`/api/auth/videos?userId=${user?.id}`, {
        cache: 'no-store'
      })
      console.log('Videos response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Videos data:', data)
        setVideos(data)
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch videos:", errorData)
        setVideos([])
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
      setVideos([])
    } finally {
      setVideosLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/auth/user-stats?userId=${user?.id}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true)
      // Fetch recent photos
      const photosResponse = await fetch(`/api/photos?userId=${user?.id}&limit=5`, {
        cache: 'no-store'
      })
      const photosData = photosResponse.ok ? await photosResponse.json() : []

      // Fetch recent journals
      const journalsResponse = await fetch(`/api/journals?userId=${user?.id}&limit=5`, {
        cache: 'no-store'
      })
      const journalsData = journalsResponse.ok ? await journalsResponse.json() : []

      // Fetch recent videos
      const videosResponse = await fetch(`/api/auth/videos?userId=${user?.id}`, {
        cache: 'no-store'
      })
      const videosData = videosResponse.ok ? await videosResponse.json() : []

      // Combine and sort by date
      const allActivity: ActivityItem[] = [
        ...photosData.map((photo: IPhoto) => ({
          id: getEntityId(photo),
          type: 'photo' as const,
          title: photo.title,
          createdAt: new Date(photo.createdAt),
          thumbnail: photo.thumbnailUrl
        })),
        ...journalsData.map((journal: IJournal) => ({
          id: getEntityId(journal),
          type: 'journal' as const,
          title: journal.title,
          createdAt: new Date(journal.createdAt)
        })),
        ...videosData.map((video: IVideo) => ({
          id: video._id?.toString() || '',
          type: 'video' as const,
          title: video.title,
          createdAt: new Date(video.createdAt || Date.now()),
          thumbnail: video.thumbnailUrl
        }))
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10)

      setActivity(allActivity)
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      setActivity([])
    } finally {
      setActivityLoading(false)
    }
  }

  const handleExportDataPDF = async () => {
    if (!stats || !user) return

    try {
      const exportData = {
        userName: user.name || 'Unknown User',
        email: user.email || '',
        stats: stats,
        recentActivity: activity,
        exportDate: new Date().toISOString()
      }

      await exportUserDataToPDF(exportData)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data as PDF')
    }
  }

  const ProgressChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
    const percentage = Math.min((value / max) * 100, 100)
    const circumference = 2 * Math.PI * 40
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`${color} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{value}</span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2 text-center">{label}</p>
      </div>
    )
  }

  if (loading || videosLoading || statsLoading || activityLoading) {
    return <Loader fullscreen message="Loading dashboard..." />
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please login to access dashboard</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 truncate">My Memory Journal</h1>
              <p className="text-gray-300 text-sm sm:text-base">Track your memories, photos, and stories</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportDataPDF}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-2 sm:px-3 lg:px-4 py-2 bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25 text-xs sm:text-sm min-w-0"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">Export</span>
              </button>
              <Link
                href="/upload-video"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-2 sm:px-3 lg:px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-xs sm:text-sm min-w-0"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="truncate">Video</span>
              </Link>
              <Link
                href="/upload-photo"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-2 sm:px-3 lg:px-4 py-2 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 text-xs sm:text-sm min-w-0"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">Photo</span>
              </Link>
              <Link
                href="/create-journal"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-2 sm:px-3 lg:px-4 py-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 text-xs sm:text-sm min-w-0"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="truncate">Journal</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-wrap bg-white/5 backdrop-blur-lg rounded-lg p-1 border border-white/10 gap-1">
          <Link
            href="/dashboard"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-white/10 rounded-md transition-colors"
          >
            <span className="truncate">Overview</span>
          </Link>
          <Link
            href="/insights"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Insights</span>
          </Link>
          <Link
            href="/gallery"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Gallery</span>
          </Link>
          <Link
            href="/timeline"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Timeline</span>
          </Link>
          <Link
            href="/photos"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Photos</span>
          </Link>
          <Link
            href="/video"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Videos</span>
          </Link>
          <Link
            href="/journals"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Journals</span>
          </Link>
          <Link
            href="/export"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Export</span>
          </Link>
          <Link
            href="/search"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Search</span>
          </Link>
          <Link
            href="/settings"
            className="flex-1 min-w-0 text-center px-1 sm:px-2 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <span className="truncate">Settings</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsLoading ? (
            <div className="col-span-2 sm:col-span-2 lg:col-span-4 flex justify-center">
              <Loader message="Loading statistics..." />
            </div>
          ) : stats ? (
            <>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10">
                <ProgressChart value={stats.totalPhotos} max={100} label="Photos" color="text-blue-400" />
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10">
                <ProgressChart value={stats.totalVideos} max={50} label="Videos" color="text-purple-400" />
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10">
                <ProgressChart value={stats.totalJournals} max={200} label="Journals" color="text-green-400" />
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10">
                <ProgressChart value={stats.streak} max={30} label="Day Streak" color="text-yellow-400" />
              </div>
            </>
          ) : null}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Activity Feed */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3 sm:space-y-4">
                {activityLoading ? (
                  <div className="flex justify-center items-center py-6 sm:py-8">
                    <Loader message="Loading activity..." />
                  </div>
                ) : activity.length > 0 ? (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === 'photo' ? 'bg-blue-600' :
                        item.type === 'video' ? 'bg-purple-600' : 'bg-green-600'
                      }`}>
                        {item.type === 'photo' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : item.type === 'video' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        <p className="text-xs text-gray-400">
                          {item.createdAt.toLocaleDateString()} • {item.type}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-6 sm:py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">My Videos</h3>
              {videosLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <Loader message="Loading your videos..." />
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.slice(0, 4).map((video) => (
                    <VideoCard
                      key={video._id?.toString() || Math.random().toString()}
                      video={video}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">No videos yet</h4>
                  <p className="text-gray-400 mb-4 text-sm sm:text-base">Start sharing your stories with the world.</p>
                  <Link
                    href="/upload-video"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
                  >
                    Upload Your First Video
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}