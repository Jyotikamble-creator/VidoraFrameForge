"use client";

import { ThumbsUp, MessageCircle } from "lucide-react";
import { Comment } from "@/types/video/video";
import { formatTimeAgo } from "@/lib/utils/formatTimeAgo";

interface CommentItemProps {
  comment: Comment;
}

const CommentItem = ({ comment }: CommentItemProps) => {
  return (
    <div className="flex gap-3">
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            comment.author.name.charAt(0)
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">
            {comment.author.name}
          </span>
          <span className="text-gray-400 text-xs">
            {formatTimeAgo(comment.postedAt)}
          </span>
        </div>

        <p className="text-gray-300 text-sm">{comment.content}</p>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs">{comment.likes}</span>
          </button>
          <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;