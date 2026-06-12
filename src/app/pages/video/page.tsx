"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import Loader from "@/ui/Loader"
import VideoCard from "@/components/video/VideoCard"
import { Video } from "@/types/video/video"
import { exportMultipleVideosToPDF, VideoExportData } from "@/lib/utils/pdfExport"

export default function VideosPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos()
    }
  }, [isAuthenticated])

  useEffect(() => {
    filterVideos()
  }, [videos, searchTerm, selectedCategory, selectedTag])

  const fetchVideos = async () => {
    try {
      setVideosLoading(true)
      const response = await fetch(`/api/auth/videos?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data)

        // Extract unique categories and tags
        const uniqueCategories = [...new Set(data.map((video: Video) => video.category).filter(Boolean))] as string[]
        const uniqueTags = [...new Set(data.flatMap((video: Video) => video.tags || []))] as string[]

        setCategories(uniqueCategories)
        setTags(uniqueTags)
      } else {
        console.error("Failed to fetch videos")
        setVideos([])
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
      setVideos([])
    } finally {
      setVideosLoading(false)
    }
  }

  const filterVideos = () => {
    let filtered = videos

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(video =>
        (video.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(video => video.category === selectedCategory)
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(video => video.tags?.includes(selectedTag))
    }

    setFilteredVideos(filtered)
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      const response = await fetch(`/api/auth/videos/${videoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setVideos(videos.filter(video => video._id !== videoId))
      } else {
        console.error("Failed to delete video")
      }
    } catch (error) {
      console.error("Error deleting video:", error)
    }
  }

  const handleExportAllVideos = async () => {
    if (filteredVideos.length === 0) {
      alert('No videos to export')
      return
    }

    try {
      const exportData: VideoExportData[] = filteredVideos.map(video => ({
        title: video.title || 'Untitled Video',
        description: video.description,
        url: video.videoUrl || '',
        thumbnailUrl: video.thumbnailUrl,
        category: video.category,
        tags: video.tags,
        createdAt: video.createdAt,
        fileName: video.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.mp4' || 'video.mp4',
        size: 0, // Size not available in video interface
        duration: 0 // Duration not available in video interface
      }))

      await exportMultipleVideosToPDF(exportData)
    } catch (error) {
      console.error('Failed to export videos:', error)
      alert('Failed to export videos as PDF')
    }
  }

  if (loading) return <Loader fullscreen />

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-md w-full mx-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please login to view your videos</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Videos</h1>
              <p className="text-gray-300">Browse and manage your video collection</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{filteredVideos.length}</p>
              <p className="text-gray-400 text-sm">Total Videos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search videos..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="" className="bg-slate-800">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-slate-800">{category}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label htmlFor="tag" className="block text-sm font-medium text-gray-300 mb-2">
                Tag
              </label>
              <select
                id="tag"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="" className="bg-slate-800">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag} className="bg-slate-800">#{tag}</option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <div className="flex items-end">
              <a
                href="/upload-video"
                className="w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-sm"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Upload Video</span>
                <span className="sm:hidden">Upload</span>
              </a>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={handleExportAllVideos}
                disabled={filteredVideos.length === 0}
                className="w-full px-3 sm:px-4 py-2 bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export All PDF</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory || selectedTag) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("")
                  setSelectedTag("")
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Videos Grid */}
        {videosLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader message="Loading your videos..." />
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div key={video._id} className="relative group">
                <VideoCard
                  video={video}
                  onDelete={handleDeleteVideo}
                />
                {/* Action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                  <button
                    onClick={() => handleDeleteVideo(video._id.toString())}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
                    title="Delete video"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 max-w-md">
              <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No videos found</h3>
              <p className="text-gray-400 mb-8">
                {videos.length === 0
                  ? "Start sharing your stories with the world. Upload your first video to get started."
                  : "Try adjusting your search or filters to find what you're looking for."
                }
              </p>
              {videos.length === 0 && (
                <Link
                  href="/upload-video"
                  className="inline-flex items-center px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Your First Video
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
