"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useSearchParams } from "next/navigation"
import Loader from "@/ui/Loader"
import PhotoCard from "@/components/photo/PhotoCard"
import VideoCard from "@/components/video/VideoCard"
import JournalCard from "@/components/journal/JournalCard"
import { IPhoto } from "@/server/models/Photo"
import { IVideo } from "@/server/models/Video"
import { IJournal } from "@/server/models/Journal"

function getItemId(item: unknown): string {
  if (!item || typeof item !== "object") return ""

  const maybeWithId = item as { id?: string; _id?: string | { toString: () => string } }
  if (typeof maybeWithId.id === "string") return maybeWithId.id
  if (typeof maybeWithId._id === "string") return maybeWithId._id
  if (maybeWithId._id && typeof maybeWithId._id.toString === "function") {
    return maybeWithId._id.toString()
  }

  return ""
}

interface SearchResult {
  id: string
  type: 'photo' | 'video' | 'journal'
  item: IPhoto | IVideo | IJournal
  relevance: number
}

export default function SearchContent() {
  const { user, isAuthenticated, loading } = useAuth()
  const searchParams = useSearchParams()
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [contentType, setContentType] = useState<'all' | 'photos' | 'videos' | 'journals'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance')

  useEffect(() => {
    if (query.trim()) {
      performSearch()
    }
  }, [query, contentType, sortBy])

  const performSearch = async () => {
    if (!query.trim()) return

    setSearchLoading(true)

    try {
      const searchPromises = []

      // Search photos
      if (contentType === 'all' || contentType === 'photos') {
        searchPromises.push(
          fetch(`/api/photos?search=${encodeURIComponent(query)}${user?.id ? `&userId=${user.id}` : ''}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => data.map((item: IPhoto) => ({
              id: getItemId(item),
              type: 'photo' as const,
              item,
              relevance: calculateRelevance(item, query, 'photo')
            })))
        )
      }

      // Search videos
      if (contentType === 'all' || contentType === 'videos') {
        searchPromises.push(
          fetch(`/api/videos?search=${encodeURIComponent(query)}${user?.id ? `&userId=${user.id}` : ''}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => data.map((item: IVideo) => ({
              id: item._id?.toString() || '',
              type: 'video' as const,
              item,
              relevance: calculateRelevance(item, query, 'video')
            })))
        )
      }

      // Search journals
      if (contentType === 'all' || contentType === 'journals') {
        searchPromises.push(
          fetch(`/api/journals?search=${encodeURIComponent(query)}${user?.id ? `&userId=${user.id}` : ''}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => data.map((item: IJournal) => ({
              id: getItemId(item),
              type: 'journal' as const,
              item,
              relevance: calculateRelevance(item, query, 'journal')
            })))
        )
      }

      const allResults = await Promise.all(searchPromises)
      const flattenedResults = allResults.flat()

      // Sort results
      if (sortBy === 'date') {
        flattenedResults.sort((a, b) => {
          const dateA = new Date(a.item.createdAt).getTime()
          const dateB = new Date(b.item.createdAt).getTime()
          return dateB - dateA
        })
      } else {
        flattenedResults.sort((a, b) => b.relevance - a.relevance)
      }

      setResults(flattenedResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const calculateRelevance = (item: IPhoto | IVideo | IJournal, searchQuery: string, type: string): number => {
    const query = searchQuery.toLowerCase().trim()
    let score = 0

    // Skip empty queries
    if (!query) return 0

    // Title match (highest weight) - exact match gets higher score
    if (item.title) {
      const title = item.title.toLowerCase()
      if (title === query) {
        score += 20 // Exact title match
      } else if (title.includes(query)) {
        score += 10 // Partial title match
        // Bonus for title starting with query
        if (title.startsWith(query)) score += 5
      }
    }

    // Tag matches - each tag match adds points
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => {
        if (tag && typeof tag === 'string') {
          const tagLower = tag.toLowerCase()
          if (tagLower === query) {
            score += 12 // Exact tag match
          } else if (tagLower.includes(query)) {
            score += 8 // Partial tag match
          }
        }
      })
    }

    // Content/description matches with proper type checking
    if (type === 'journal' && 'content' in item && item.content) {
      const content = item.content.toLowerCase()
      const matches = (content.match(new RegExp(query, 'gi')) || []).length
      if (matches > 0) {
        score += Math.min(matches * 3, 15) // Up to 15 points for multiple matches
        // Bonus for content starting with query
        if (content.includes(query)) score += 2
      }
    }

    if ((type === 'photo' || type === 'video') && 'description' in item && item.description) {
      const description = item.description.toLowerCase()
      const matches = (description.match(new RegExp(query, 'gi')) || []).length
      if (matches > 0) {
        score += Math.min(matches * 3, 15) // Up to 15 points for multiple matches
        // Bonus for description starting with query
        if (description.includes(query)) score += 2
      }
    }

    // Album/location matches with proper type checking
    if ('album' in item && item.album) {
      const album = item.album.toLowerCase()
      if (album === query) {
        score += 8 // Exact album match
      } else if (album.includes(query)) {
        score += 4 // Partial album match
      }
    }

    if ('location' in item && item.location) {
      const location = item.location.toLowerCase()
      if (location === query) {
        score += 8 // Exact location match
      } else if (location.includes(query)) {
        score += 4 // Partial location match
      }
    }

    // Mood matches for journals with proper type checking
    if (type === 'journal' && 'mood' in item && item.mood) {
      const mood = item.mood.toLowerCase()
      if (mood === query) {
        score += 6 // Exact mood match
      } else if (mood.includes(query)) {
        score += 3 // Partial mood match
      }
    }

    // Recency bonus (newer items get slight boost)
    if (item.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 7) score += 2 // Less than a week old
      else if (daysSinceCreation < 30) score += 1 // Less than a month old
    }

    return score
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      performSearch()
    }
  }

  if (loading) return <Loader fullscreen />

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Please login to search your content</p>
          <a href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Login
          </a>
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
              <h1 className="text-4xl font-bold text-white mb-2">Search Results</h1>
              <p className="text-gray-300">Find your cherished memories across all your photos, videos, and journal entries</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{results.length}</p>
              <p className="text-gray-400 text-sm">Results Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your photos, videos, and journals..."
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button
                type="submit"
                disabled={!query.trim() || searchLoading}
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Content Type:</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as 'all' | 'photos' | 'videos' | 'journals')}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all" className="bg-slate-800">All Content</option>
                  <option value="photos" className="bg-slate-800">Photos Only</option>
                  <option value="videos" className="bg-slate-800">Videos Only</option>
                  <option value="journals" className="bg-slate-800">Journals Only</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance" className="bg-slate-800">Relevance</option>
                  <option value="date" className="bg-slate-800">Date</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-8">
          {searchLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader message="Searching your memories..." />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="text-center">
                <p className="text-gray-400">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
                </p>
              </div>

              {/* Group results by type */}
              {['photo', 'video', 'journal'].map(type => {
                const typeResults = results.filter(r => r.type === type)
                if (typeResults.length === 0) return null

                return (
                  <div key={type}>
                    <h2 className="text-2xl font-bold text-white mb-6 capitalize flex items-center">
                      {type === 'photo' && <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                      {type === 'video' && <svg className="w-6 h-6 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                      {type === 'journal' && <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                      {type}s ({typeResults.length})
                    </h2>

                    <div className={`grid gap-6 ${
                      type === 'photo' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                      type === 'video' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                      'space-y-6'
                    }`}>
                      {typeResults.map(result => (
                        <div key={result.id}>
                          {result.type === 'photo' && <PhotoCard photo={result.item as IPhoto} />}
                          {result.type === 'video' && <VideoCard video={result.item as IVideo} />}
                          {result.type === 'journal' && <JournalCard journal={result.item as IJournal} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : query.trim() ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 max-w-md">
                <div className="w-20 h-20 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">No results found</h3>
                <p className="text-gray-400 mb-8">
                  Try adjusting your search terms or filters. You can search by title, description, tags, location, or mood.
                </p>
                <div className="text-sm text-gray-500">
                  <p className="mb-2">Search tips:</p>
                  <ul className="text-left space-y-1">
                    <li>• Use specific keywords from your content</li>
                    <li>• Try searching for tags (e.g., &quot;vacation&quot;)</li>
                    <li>• Search for locations (e.g., &quot;Paris&quot;)</li>
                    <li>• For journals, search for moods (e.g., &quot;happy&quot;)</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 max-w-md">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Search Your Memories</h3>
                <p className="text-gray-400 mb-8">
                  Enter a search term above to find your photos, videos, and journal entries across all your content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}