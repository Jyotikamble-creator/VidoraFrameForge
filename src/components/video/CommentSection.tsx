"use client";

import { useState } from "react";
import CommentItem from "./CommentItem";
import { Comment } from "@/types/video/video";

interface CommentSectionProps {
  comments: Comment[];
  commentCount: number;
}

export const CommentSection = ({ comments, commentCount }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New comment:", newComment);
    setNewComment("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">{commentCount} Comments</h2>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shrink-0">
          U
        </div>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-4 py-2 bg-transparent border-b border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} />
        ))}
      </div>
    </div>
  );
};