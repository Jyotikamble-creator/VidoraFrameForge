"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import Loader from "@/ui/Loader"
import { useRouter } from "next/navigation"
import { uploadToImageKit } from "@/lib/utils/imagekitUpload"
import { useUpload } from "@/hooks/useUpload"

type UploadType = 'photo' | 'video' | 'journal'

export default function UnifiedUploadPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const { uploadVideo, uploading: videoUploading } = useUpload()
  const [uploadType, setUploadType] = useState<UploadType>('photo')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "", // for journal
    tags: "",
    category: "", // for video
    mood: "", // for journal
    album: "", // for photo
    location: "",
    isPublic: true
  })

  if (loading) return <Loader fullscreen />

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-md w-full mx-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please login to upload content</p>
            <a
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              Login to Continue
            </a>
          </div>
        </div>
      </div>
    )
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (uploadType === 'journal') {
      // Multiple files for journal
      const validFiles = files.filter(file => {
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
        const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB limit
        return isValidType && isValidSize
      })
      setSelectedFiles(validFiles)
      if (validFiles.length > 0) {
        setPreview(URL.createObjectURL(validFiles[0]))
      }
    } else {
      // Single file for photo/video
      const file = files[0]
      if (file) {
        setSelectedFiles([file])
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0 || !user?.id) return

    setUploading(true)

    try {
      if (uploadType === 'video') {
        // Use video upload hook
        await uploadVideo(selectedFiles[0], {
          title: formData.title || selectedFiles[0].name,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          isPublic: formData.isPublic,
        })
        router.push('/dashboard')
      } else if (uploadType === 'photo') {
        // Upload photo to ImageKit
        const uploadResult = await uploadToImageKit(selectedFiles[0]) as any

        // Save photo metadata
        const photoData = {
          title: formData.title || selectedFiles[0].name,
          description: formData.description,
          photoUrl: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnail || uploadResult.url,
          fileId: uploadResult.fileId,
          fileName: selectedFiles[0].name,
          size: selectedFiles[0].size,
          width: uploadResult.width,
          height: uploadResult.height,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          album: formData.album || undefined,
          location: formData.location || undefined,
          isPublic: formData.isPublic,
        }

        const response = await fetch('/api/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(photoData)
        })

        if (response.ok) {
          router.push('/dashboard')
        } else {
          throw new Error('Failed to save photo')
        }
      } else if (uploadType === 'journal') {
        // Upload attachments to ImageKit
        const uploadedAttachments = []
        for (const file of selectedFiles) {
          const uploadResult = await uploadToImageKit(file) as any
          uploadedAttachments.push({
            url: uploadResult.url,
            fileId: uploadResult.fileId,
            fileName: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            size: file.size,
            width: uploadResult.width,
            height: uploadResult.height,
          })
        }

        // Save journal
        const journalData = {
          title: formData.title,
          content: formData.content,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          mood: formData.mood || undefined,
          location: formData.location || undefined,
          isPublic: formData.isPublic,
          attachments: uploadedAttachments,
        }

        const response = await fetch('/api/journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(journalData)
        })

        if (response.ok) {
          router.push('/dashboard')
        } else {
          throw new Error('Failed to save journal')
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const isUploading = uploading || videoUploading

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Upload Content</h1>
              <p className="text-gray-300">Share photos, videos, or journal entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Type *
              </label>
              <div className="flex gap-4">
                {(['photo', 'video', 'journal'] as UploadType[]).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      name="uploadType"
                      value={type}
                      checked={uploadType === type}
                      onChange={(e) => {
                        setUploadType(e.target.value as UploadType)
                        setSelectedFiles([])
                        setPreview(null)
                      }}
                      className="mr-2"
                    />
                    <span className="text-white capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {uploadType === 'journal' ? 'Attachments' : `${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} File`} *
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept={uploadType === 'photo' ? 'image/*' : uploadType === 'video' ? 'video/*' : 'image/*,video/*'}
                  multiple={uploadType === 'journal'}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {selectedFiles.length > 0 ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={uploadType === 'photo' ? "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" : uploadType === 'video' ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg text-white font-medium">
                          {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
                        </p>
                        {selectedFiles.length === 1 && (
                          <p className="text-gray-400 text-sm">{(selectedFiles[0].size / (1024 * 1024)).toFixed(2)} MB</p>
                        )}
                      </div>
                      <p className="text-purple-400">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xl text-white">Drop your {uploadType === 'journal' ? 'files' : uploadType} here</p>
                        <p className="text-gray-400">or click to browse</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {preview && selectedFiles.length === 1 && (
                <div className="mt-4">
                  <img src={preview} alt="Preview" className="max-w-full h-48 object-cover rounded-lg" />
                </div>
              )}
            </div>

            {/* Common Fields */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a title"
                className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {uploadType !== 'journal' && (
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your content"
                  rows={4}
                  className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {uploadType === 'journal' && (
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your journal entry"
                  rows={6}
                  className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Enter tags separated by commas"
                className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {uploadType === 'video' && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a category</option>
                  <option value="gaming">Gaming</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="technology">Technology</option>
                  <option value="vlog">Vlog</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {uploadType === 'photo' && (
              <div>
                <label htmlFor="album" className="block text-sm font-medium text-gray-300 mb-2">
                  Album
                </label>
                <input
                  id="album"
                  name="album"
                  type="text"
                  value={formData.album}
                  onChange={handleInputChange}
                  placeholder="Enter album name"
                  className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {uploadType === 'journal' && (
              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-gray-300 mb-2">
                  Mood
                </label>
                <input
                  id="mood"
                  name="mood"
                  type="text"
                  value={formData.mood}
                  onChange={handleInputChange}
                  placeholder="How are you feeling?"
                  className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Where was this taken?"
                className="w-full pl-4 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-300">
                Make this {uploadType} public
              </label>
            </div>

            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? `Uploading ${uploadType}...` : `Upload ${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}