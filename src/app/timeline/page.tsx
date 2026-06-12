'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '@/ui/Loader'
import { Logger, LogTags } from '@/lib/logger'
import { Calendar, Image, Video, BookOpen, Tag, User } from 'lucide-react'

interface MediaItem {
  _id: string
  type: 'photo' | 'video' | 'journal'
  title?: string
  content?: string
  description?: string
  url?: string
  videoUrl?: string
  thumbnailUrl?: string
  tags?: string[]
  createdAt: Date
  uploader?: {
    name: string
    email: string
    profilePicture?: string
  }
}

interface TimelineGroup {
  date: string
  year: number
  month: number
  items: MediaItem[]
}

export default function TimelinePage() {
  const router = useRouter()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video' | 'journal'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMedia()
  }, [typeFilter, searchQuery])

  const fetchMedia = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '200')
      params.append('sortBy', 'createdAt')
      params.append('sortOrder', 'desc')

      const response = await fetch(`/api/media?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const data = await response.json()
      setMedia(data.media || [])
      Logger.i(LogTags.AUTH, `Loaded ${data.media?.length || 0} timeline items`)
    } catch (err) {
      Logger.e(LogTags.AUTH, 'Failed to fetch timeline', { error: err })
      setError('Failed to load timeline. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Group media by month/year
  const groupedMedia: TimelineGroup[] = media.reduce((groups: TimelineGroup[], item) => {
    const date = new Date(item.createdAt)
    const year = date.getFullYear()
    const month = date.getMonth()
    const dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    const existingGroup = groups.find(g => g.year === year && g.month === month)
    
    if (existingGroup) {
      existingGroup.items.push(item)
    } else {
      groups.push({
        date: dateString,
        year,
        month,
        items: [item]
      })
    }

    return groups
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'journal':
        return <BookOpen className="w-5 h-5" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo':
        return 'bg-blue-500'
      case 'video':
        return 'bg-purple-500'
      case 'journal':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleItemClick = (item: MediaItem) => {
    switch (item.type) {
      case 'photo':
        router.push(`/photos`)
        break
      case 'video':
        router.push(`/video/${item._id}`)
        break
      case 'journal':
        router.push(`/journals/${item._id}`)
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Life Timeline
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your journey through photos, videos, and journals
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Content</option>
              <option value="photo">Photos Only</option>
              <option value="video">Videos Only</option>
              <option value="journal">Journals Only</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your timeline..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchMedia}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : groupedMedia.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No content found. Start creating your timeline!
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

            {groupedMedia.map((group, groupIndex) => (
              <div key={`${group.year}-${group.month}`} className="mb-12">
                {/* Month/Year Header */}
                <div className="flex items-center mb-6">
                  <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full text-white font-bold shadow-lg">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {group.date}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Timeline Items */}
                <div className="ml-16 space-y-6">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={item._id}
                      onClick={() => handleItemClick(item)}
                      className="relative bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-l-4"
                      style={{ borderLeftColor: getTypeColor(item.type).replace('bg-', '#') }}
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`${getTypeColor(item.type)} text-white p-2 rounded-lg`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {item.type}
                        </span>
                      </div>

                      {/* Item Content Preview */}
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.content && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {item.content}
                        </p>
                      )}

                      {/* Media Preview */}
                      {item.type === 'photo' && item.url && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                      {item.type === 'video' && item.thumbnailUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden relative">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <Video className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{item.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Author */}
                      {item.uploader && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <User className="w-4 h-4 mr-1" />
                          {item.uploader.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
