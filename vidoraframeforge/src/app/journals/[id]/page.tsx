"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useParams, useRouter } from "next/navigation"
import Loader from "@/ui/Loader"
import { IJournal } from "@/server/models/Journal"
import { exportJournalToPDF, JournalExportData } from "@/lib/utils/pdfExport"

export default function JournalDetailPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [journal, setJournal] = useState<IJournal | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [journalLoading, setJournalLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    mood: "",
    location: "",
    isPublic: true
  })

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchJournal()
    }
  }, [isAuthenticated, params.id])

  const fetchJournal = async () => {
    try {
      const response = await fetch(`/api/journals/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setJournal(data)

        // Populate form data
        setFormData({
          title: data.title || "",
          content: data.content || "",
          tags: data.tags ? data.tags.join(", ") : "",
          mood: data.mood || "",
          location: data.location || "",
          isPublic: data.isPublic !== false
        })
      } else if (response.status === 404) {
        alert("Journal not found")
        router.push("/journals")
      } else {
        throw new Error("Failed to fetch journal")
      }
    } catch (error) {
      console.error('Failed to fetch journal:', error)
      alert('Failed to load journal')
    } finally {
      setJournalLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSave = async () => {
    if (!journal || !formData.title.trim() || !formData.content.trim()) return

    setSaving(true)

    try {
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mood: formData.mood || undefined,
        location: formData.location || undefined,
        isPublic: formData.isPublic
      }

      const response = await fetch(`/api/journals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedJournal = await response.json()
        setJournal(updatedJournal)
        setIsEditing(false)
      } else {
        throw new Error('Failed to update journal')
      }
    } catch (error) {
      console.error('Failed to save journal:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    if (!journal) return

    try {
      const normalizedAuthor =
        journal.author &&
        typeof journal.author === 'object' &&
        'name' in journal.author &&
        typeof journal.author.name === 'string' &&
        journal.author.name.trim().length > 0
          ? journal.author.name
          : 'Unknown'

      const normalizedAttachments: JournalExportData['attachments'] = journal.attachments?.flatMap((attachment) => {
        if (attachment.type !== 'photo' && attachment.type !== 'video') {
          return []
        }

        const mediaType: 'photo' | 'video' = attachment.type

        return [{
          type: mediaType,
          url: attachment.url,
          thumbnailUrl: attachment.thumbnailUrl ?? undefined,
          fileId: attachment.fileId ?? attachment.id,
          fileName: attachment.fileName ?? attachment.id,
          size: attachment.size ?? 0
        }]
      })

      const exportData: JournalExportData = {
        title: journal.title,
        content: journal.content,
        author: normalizedAuthor,
        createdAt: journal.createdAt,
        mood: journal.mood ?? undefined,
        location: journal.location,
        tags: journal.tags,
        attachments: normalizedAttachments
      }

      await exportJournalToPDF(exportData)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export journal as PDF')
    }
  }

  const handleDelete = async () => {
    if (!journal) return

    if (!confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/journals/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/journals')
      } else {
        throw new Error('Failed to delete journal')
      }
    } catch (error) {
      console.error('Failed to delete journal:', error)
      alert('Failed to delete journal')
    }
  }

  if (loading || journalLoading) return <Loader fullscreen />

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Please login to view journals</p>
          <a href="/auth/login" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Login
          </a>
        </div>
      </div>
    )
  }

  if (!journal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Journal not found</p>
          <Link href="/journals" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Back to Journals
          </Link>
        </div>
      </div>
    )
  }

  const moodEmojis: Record<string, string> = {
    happy: '😊',
    excited: '🤩',
    grateful: '🙏',
    peaceful: '😌',
    thoughtful: '🤔',
    sad: '😢',
    anxious: '😰',
    angry: '😠',
    tired: '😴',
    inspired: '✨'
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/journals')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Journals
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    // Reset form data
                    setFormData({
                      title: journal.title || "",
                      content: journal.content || "",
                      tags: journal.tags ? journal.tags.join(", ") : "",
                      mood: journal.mood || "",
                      location: journal.location || "",
                      isPublic: journal.isPublic !== false
                    })
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title.trim() || !formData.content.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Journal Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          {isEditing ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Mood and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mood" className="block text-sm font-medium text-gray-300 mb-2">
                    Mood
                  </label>
                  <select
                    id="mood"
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="" className="bg-slate-800">Select mood (optional)</option>
                    {Object.entries(moodEmojis).map(([value, emoji]) => (
                      <option key={value} value={value} className="bg-slate-800">
                        {emoji} {value.charAt(0).toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Where were you?"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                  Journal Entry *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={15}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="reflection, gratitude, travel, family (comma separated)"
                />
              </div>

              {/* Public/Private */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-300">
                  Make this journal entry public
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title and Mood */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">{journal.title}</h1>
                {journal.mood && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{moodEmojis[journal.mood]}</span>
                    <span className="text-gray-400 capitalize">{journal.mood}</span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>By {journal.author && typeof journal.author === 'object' && 'name' in journal.author ? journal.author.name : 'Unknown'}</span>
                  <span>{new Date(journal.createdAt).toLocaleDateString()}</span>
                  {journal.location && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {journal.location}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {journal.isPublic ? (
                    <span className="text-green-400">Public</span>
                  ) : (
                    <span className="text-gray-500">Private</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {journal.content}
                </div>
              </div>

              {/* Tags */}
              {journal.tags && journal.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {journal.tags.map((tag, index) => (
                    <span key={index} className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {journal.attachments && journal.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {journal.attachments.map((attachment, index) => {
                      const isImage = attachment.type === 'photo'
                      const isVideo = attachment.type === 'video'

                      return (
                        <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                          {isImage ? (
                            <div className="aspect-video">
                              <img
                                src={attachment.url}
                                alt={attachment.fileName || `Attachment ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                            </div>
                          ) : isVideo ? (
                            <div className="aspect-video">
                              <video
                                src={attachment.url}
                                controls
                                className="w-full h-full object-cover"
                                poster={attachment.thumbnailUrl}
                              />
                            </div>
                          ) : (
                            <div className="p-4">
                              <div className="flex items-center space-x-3">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{attachment.fileName || `Attachment ${index + 1}`}</p>
                                  <p className="text-gray-400 text-sm">{attachment.type || 'Unknown type'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="p-3 bg-white/5">
                            <button
                              onClick={() => window.open(attachment.url, '_blank')}
                              className="w-full text-center text-sm text-green-400 hover:text-green-300 transition-colors"
                            >
                              View Full Size
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}