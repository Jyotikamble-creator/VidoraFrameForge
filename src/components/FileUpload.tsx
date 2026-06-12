"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useUpload } from "@/hooks/useUpload"

export default function FileUpload() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { uploadVideo, uploading, progress } = useUpload()
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    isPublic: true
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !metadata.title) return

    if (!isAuthenticated) {
      router.push("/auth/signup")
      return
    }

    try {
      await uploadVideo(file, {
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags,
        isPublic: metadata.isPublic,
      })
      // Reset form
      setFile(null)
      setMetadata({
        title: "",
        description: "",
        category: "",
        tags: "",
        isPublic: true
      })
      // Navigate to dashboard to see the uploaded video
      router.push('/dashboard')
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video File *
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              id="video-upload"
              required
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <p className="text-purple-400">Click to change video</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl text-white">Drop your video here</p>
                    <p className="text-gray-400">or click to browse</p>
                    <p className="text-xs text-gray-500 mt-2">MP4, MOV, AVI up to 500MB</p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={metadata.title}
            onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter video title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Describe your video..."
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <select
            id="category"
            value={metadata.category}
            onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="" className="bg-slate-800">Select a category</option>
            <option value="Travel" className="bg-slate-800">Travel</option>
            <option value="Nature" className="bg-slate-800">Nature</option>
            <option value="Lifestyle" className="bg-slate-800">Lifestyle</option>
            <option value="Technology" className="bg-slate-800">Technology</option>
            <option value="Education" className="bg-slate-800">Education</option>
            <option value="Entertainment" className="bg-slate-800">Entertainment</option>
            <option value="Gaming" className="bg-slate-800">Gaming</option>
            <option value="Music" className="bg-slate-800">Music</option>
            <option value="Sports" className="bg-slate-800">Sports</option>
            <option value="Other" className="bg-slate-800">Other</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            value={metadata.tags}
            onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="gaming, tutorial, music (comma separated)"
          />
        </div>

        {/* Public/Private */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={metadata.isPublic}
            onChange={(e) => setMetadata(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-300">
            Make this video public
          </label>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-linear-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 hover:text-white font-semibold rounded-lg transition-all duration-300 border border-gray-600/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || !metadata.title || uploading}
            className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </form>
    </div>
  )
}