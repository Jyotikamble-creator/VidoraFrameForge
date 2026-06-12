"use client"

import Link from "next/link"
import { IJournal } from "@/server/models/Journal"

interface JournalCardProps {
  journal: IJournal
}

export default function JournalCard({ journal }: JournalCardProps) {
  const getCreatedAt = () => {
    if (journal.createdAt) {
      return new Date(journal.createdAt).toLocaleDateString()
    }
    return ''
  }

  const getAuthorName = () => {
    if (journal.author && typeof journal.author === 'object' && 'name' in journal.author) {
      return journal.author.name
    }
    return 'Unknown'
  }

  const getMoodEmoji = (mood?: string) => {
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
    return mood ? moodEmojis[mood] || '📝' : '📝'
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="group bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10 cursor-pointer">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
              <span className="text-lg">{getMoodEmoji(journal.mood)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white line-clamp-2 group-hover:text-green-300 transition-colors">
                {journal.title}
              </h3>
              <p className="text-sm text-gray-400">By {getAuthorName()}</p>
            </div>
          </div>
          {journal.location && (
            <div className="flex items-center text-xs text-gray-400">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {journal.location}
            </div>
          )}
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          {truncateContent(journal.content)}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {journal.tags && journal.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
            {journal.tags && journal.tags.length > 3 && (
              <span className="text-gray-500 text-xs">+{journal.tags.length - 3} more</span>
            )}
          </div>
          <span className="text-xs text-gray-500">{getCreatedAt()}</span>
        </div>

        {journal.attachments && journal.attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {journal.attachments.length} attachment{journal.attachments.length !== 1 ? 's' : ''}
              </div>
              {journal.attachments[0]?.type === 'photo' && (
                <div className="w-12 h-12 rounded overflow-hidden border border-white/20">
                  <img
                    src={journal.attachments[0].url}
                    alt="Attachment preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}