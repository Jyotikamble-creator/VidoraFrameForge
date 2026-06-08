"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { MessageCircle, Send, Loader2, Edit2, Trash2, Reply } from "lucide-react"
import { ContentType } from "@prisma/client"

// Simple date formatter to show relative time
const formatDistanceToNow = (date: Date | string): string => {
  const now = new Date()
  const targetDate = new Date(date)
  const seconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return targetDate.toLocaleDateString()
}

interface Comment {
  id: string
  userId: string
  contentType: string
  contentId: string
  text: string
  parentCommentId?: string | null
  createdAt: string
  updatedAt?: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  contentType: ContentType
  contentId: string
  initialCommentCount?: number
}

export function CommentSection({
  contentType,
  contentId,
  initialCommentCount = 0,
}: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  useEffect(() => {
    fetchComments()
  }, [contentType, contentId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/comments?contentType=${contentType}&contentId=${contentId}`
      )
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setCommentCount(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          content: newComment,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setCommentCount((prev) => prev + 1)
        setNewComment("")
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      console.error("Failed to post comment:", error)
      alert("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(
          comments.map((c) => (c.id === commentId ? data.comment : c))
        )
        setEditingId(null)
        setEditContent("")
      }
    } catch (error) {
      console.error("Failed to edit comment:", error)
      alert("Failed to edit comment")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
        setCommentCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
      alert("Failed to delete comment")
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) return

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          content: replyContent,
          parentComment: parentId,
        }),
      })

      if (response.ok) {
        fetchComments() // Refresh to get nested replies
        setReplyingTo(null)
        setReplyContent("")
      }
    } catch (error) {
      console.error("Failed to post reply:", error)
      alert("Failed to post reply")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-gray-400" />
        <h3 className="text-xl font-bold text-white">
          {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
        </h3>
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-gray-400">
            Please{" "}
            <a href="/auth/login" className="text-purple-400 hover:text-purple-300">
              login
            </a>{" "}
            to comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shrink-0">
                  {comment.user?.name?.charAt(0).toUpperCase() || "C"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-semibold text-white">
                        {comment.user?.name || "Anonymous"}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        {formatDistanceToNow(comment.createdAt)}
                      </span>
                    </div>
                    {user?.id === comment.userId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(comment.id)
                            setEditContent(comment.text)
                          }}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-white"
                        maxLength={500}
                      />
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditContent("")
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-300">{comment.text}</p>
                  )}

                  {/* Reply button */}
                  {isAuthenticated && editingId !== comment.id && (
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-sm text-purple-400 hover:text-purple-300 mt-2 flex items-center gap-1"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  )}

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                        maxLength={500}
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent("")
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Nested replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 mt-3 space-y-3 border-l-2 border-white/10 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                            {reply.user?.name?.charAt(0).toUpperCase() || "R"}
                          </div>
                          <div className="flex-1">
                            <div>
                              <span className="font-semibold text-white text-sm">
                                {reply.user?.name || "Anonymous"}
                              </span>
                              <span className="text-gray-400 text-xs ml-2">
                                {formatDistanceToNow(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
