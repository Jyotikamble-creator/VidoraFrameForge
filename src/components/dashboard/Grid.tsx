import { UserVideo } from "@/types/dashboard";
import { VideoCard } from "../dashboard/Card";

interface VideoGridProps {
  videos: UserVideo[];
  onVideoMenuClick: (videoId: string) => void;
}

export const VideoGrid = ({ videos, onVideoMenuClick }: VideoGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onMenuClick={onVideoMenuClick}
        />
      ))}
    </div>
  );
};