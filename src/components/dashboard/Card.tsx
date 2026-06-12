import Image from "next/image";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { UserVideo } from "@/types/dashboard";
import { formatViews, formatTimeAgo } from "@/lib/utils";

interface VideoCardProps {
  video: UserVideo;
  onMenuClick: (videoId: string) => void;
}

export const VideoCard = ({ video, onMenuClick }: VideoCardProps) => {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-[#1e2837] hover:bg-[#2a3544] transition-colors">
      {/* Thumbnail */}
      <Link href={`/watch/${video.id}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-gray-800">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          )}
        </div>
      </Link>

      {/* Video Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/watch/${video.id}`}>
            <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
              {video.title}
            </h3>
          </Link>
          <button
            onClick={() => onMenuClick(video.id)}
            className="p-1 hover:bg-white/10 rounded transition-colors shrink-0"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            {formatViews(video.views)} Views • {formatTimeAgo(video.uploadedAt)}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              video.visibility === "Public"
                ? "bg-green-500/20 text-green-400"
                : video.visibility === "Private"
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {video.visibility}
          </span>
        </div>
      </div>
    </div>
  );
};