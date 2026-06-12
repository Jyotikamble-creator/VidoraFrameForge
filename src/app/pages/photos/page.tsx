"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import PhotoCard from "@/components/photo/PhotoCard"
import Loader from "@/ui/Loader"
import { IPhoto } from "@/server/models/Photo"
import Link from "next/link"
import { exportMultiplePhotosToPDF, PhotoExportData } from "@/lib/utils/pdfExport"

function getPhotoId(photo: unknown): string {
  if (!photo || typeof photo !== "object") return ""

  const maybeWithId = photo as { id?: string; _id?: string | { toString: () => string } }
  if (typeof maybeWithId.id === "string") return maybeWithId.id
  if (typeof maybeWithId._id === "string") return maybeWithId._id
  if (maybeWithId._id && typeof maybeWithId._id.toString === "function") {
    return maybeWithId._id.toString()
  }

  return ""
}

export default function PhotosPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [photos, setPhotos] = useState<IPhoto[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<IPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlbum, setSelectedAlbum] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [albums, setAlbums] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserPhotos()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    filterPhotos()
  }, [photos, searchTerm, selectedAlbum, selectedTag])

  const fetchUserPhotos = async () => {
    try {
      const response = await fetch(`/api/photos?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)

        // Extract unique albums and tags
        const uniqueAlbums = [...new Set(data.map((photo: IPhoto) => photo.album).filter(Boolean))] as string[]
        const uniqueTags = [...new Set(data.flatMap((photo: IPhoto) => photo.tags || []))] as string[]

        setAlbums(uniqueAlbums)
        setTags(uniqueTags)
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setPhotosLoading(false)
    }
  }

  const filterPhotos = () => {
    let filtered = photos

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(photo =>
        (photo.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by album
    if (selectedAlbum) {
      filtered = filtered.filter(photo => photo.album === selectedAlbum)
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(photo => photo.tags?.includes(selectedTag))
    }

    setFilteredPhotos(filtered)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPhotos(photos.filter((photo) => getPhotoId(photo) !== photoId))
      } else {
        alert('Failed to delete photo')
      }
    } catch (error) {
      console.error('Failed to delete photo:', error)
      alert('Failed to delete photo')
    }
  }

  const handleExportAllPhotos = async () => {
    if (filteredPhotos.length === 0) {
      alert('No photos to export')
      return
    }

    try {
      const exportData: PhotoExportData[] = filteredPhotos.map(photo => ({
        title: photo.title || 'Untitled Photo',
        description: photo.description ?? undefined,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        album: photo.album ?? undefined,
        tags: photo.tags,
        createdAt: photo.createdAt,
        fileName: photo.fileName || 'photo.jpg',
        size: photo.size || 0
      }))

      await exportMultiplePhotosToPDF(exportData)
    } catch (error) {
      console.error('Failed to export photos:', error)
      alert('Failed to export photos as PDF')
    }
  }

  if (loading) return <Loader fullscreen />

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-md w-full mx-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please login to view your photos</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
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
              <h1 className="text-4xl font-bold text-white mb-2">My Photos</h1>
              <p className="text-gray-300">Browse and manage your photo collection</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{filteredPhotos.length}</p>
              <p className="text-gray-400 text-sm">Total Photos</p>
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
                placeholder="Search photos..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Album Filter */}
            <div>
              <label htmlFor="album" className="block text-sm font-medium text-gray-300 mb-2">
                Album
              </label>
              <select
                id="album"
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" className="bg-slate-800">All Albums</option>
                {albums.map(album => (
                  <option key={album} value={album} className="bg-slate-800">{album}</option>
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
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                href="/upload-photo"
                className="w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 text-sm"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Upload Photo</span>
                <span className="sm:hidden">Upload</span>
              </a>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={handleExportAllPhotos}
                disabled={filteredPhotos.length === 0}
                className="w-full px-3 sm:px-4 py-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-sm"
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
          {(searchTerm || selectedAlbum || selectedTag) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedAlbum("")
                  setSelectedTag("")
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        {photosLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader message="Loading your photos..." />
          </div>
        ) : filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <div key={getPhotoId(photo) || photo.url} className="relative group">
                <PhotoCard photo={photo} />
                {/* Action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                  <button
                    onClick={() => handleDeletePhoto(getPhotoId(photo))}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
                    title="Delete photo"
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
              <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No photos found</h3>
              <p className="text-gray-400 mb-8">
                {photos.length === 0
                  ? "Start sharing your memories with the world. Upload your first photo to get started."
                  : "Try adjusting your search or filters to find what you're looking for."
                }
              </p>
              {photos.length === 0 && (
                <a
                  href="/upload-photo"
                  className="inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Your First Photo
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}