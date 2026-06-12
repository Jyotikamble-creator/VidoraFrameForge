'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  Download, 
  FileText, 
  Archive, 
  Calendar,
  Loader2,
  CheckCircle,
  Image,
  Video,
  BookOpen
} from 'lucide-react'
import { 
  exportTimelineToPDF, 
  exportAsZip,
  type TimelineExportData,
  type ZipExportData 
} from '@/lib/utils/pdfExport'
import { Logger, LogTags } from '@/lib/logger'

export default function ExportPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleTimelinePDFExport = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    setExportType('timeline-pdf')
    setSuccess(null)

    try {
      // Fetch all media from the unified API
      const response = await fetch('/api/media?limit=500&sortBy=createdAt&sortOrder=asc')
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline data')
      }

      const data = await response.json()
      
      const timelineData: TimelineExportData = {
        userName: user.name || user.email || 'User',
        items: data.media.map((item: any) => ({
          type: item.type,
          title: item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
          description: item.description,
          content: item.content,
          createdAt: new Date(item.createdAt),
          tags: item.tags,
          mood: item.mood,
          url: item.url || item.videoUrl,
          thumbnailUrl: item.thumbnailUrl
        })),
        dateRange: {
          start: data.media[0]?.createdAt ? new Date(data.media[0].createdAt) : new Date(),
          end: data.media[data.media.length - 1]?.createdAt 
            ? new Date(data.media[data.media.length - 1].createdAt) 
            : new Date()
        }
      }

      await exportTimelineToPDF(timelineData)
      setSuccess('Timeline PDF exported successfully!')
      Logger.i(LogTags.AUTH, 'Timeline PDF exported successfully')
    } catch (error) {
      Logger.e(LogTags.AUTH, 'Failed to export timeline PDF', { error })
      alert('Failed to export timeline PDF. Please try again.')
    } finally {
      setLoading(false)
      setExportType(null)
    }
  }

  const handleZipExport = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    setExportType('zip')
    setSuccess(null)

    try {
      // Fetch photos
      const photosResponse = await fetch('/api/photos?limit=500')
      if (!photosResponse.ok) throw new Error('Failed to fetch photos')
      const photosData = await photosResponse.json()

      // Fetch journals
      const journalsResponse = await fetch('/api/journals?limit=500')
      if (!journalsResponse.ok) throw new Error('Failed to fetch journals')
      const journalsData = await journalsResponse.json()

      const zipData: ZipExportData = {
        userName: user.name || user.email || 'User',
        photos: photosData.map((photo: any) => ({
          title: photo.title || 'Untitled Photo',
          url: photo.url,
          fileName: photo.fileName || 'photo.jpg',
          description: photo.description,
          tags: photo.tags,
          createdAt: new Date(photo.createdAt)
        })),
        journals: journalsData.map((journal: any) => ({
          title: journal.title,
          content: journal.content,
          mood: journal.mood,
          tags: journal.tags,
          createdAt: new Date(journal.createdAt)
        }))
      }

      await exportAsZip(zipData)
      setSuccess('ZIP archive exported successfully!')
      Logger.i(LogTags.AUTH, 'ZIP export completed successfully')
    } catch (error) {
      Logger.e(LogTags.AUTH, 'Failed to export ZIP', { error })
      alert('Failed to export ZIP archive. Please try again.')
    } finally {
      setLoading(false)
      setExportType(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Export Your Memories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Download your complete collection in various formats
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">{success}</span>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-4">
          {/* Timeline PDF Export */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Timeline PDF Export
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Export your entire life timeline as a beautifully formatted PDF document. 
                    Includes all photos, videos, and journals organized chronologically by month.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      <Image className="w-3 h-3" />
                      Photos
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      <Video className="w-3 h-3" />
                      Videos
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      <BookOpen className="w-3 h-3" />
                      Journals
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleTimelinePDFExport}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {loading && exportType === 'timeline-pdf' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ZIP Export */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Archive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Complete ZIP Archive
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Download a complete ZIP archive containing all your photos (original files) 
                    and journals (text format). Perfect for backup or offline access.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Original photo files with metadata
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Journal entries in text format
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      JSON index for programmatic access
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleZipExport}
                disabled={loading}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {loading && exportType === 'zip' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Export ZIP
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Export Information
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Exports include all your public and private content</li>
                  <li>• Large exports may take a few minutes to process</li>
                  <li>• ZIP exports download actual image files (larger file size)</li>
                  <li>• PDF exports contain references and metadata only</li>
                  <li>• All exports are generated locally in your browser</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
