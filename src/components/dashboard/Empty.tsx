import { Upload } from "lucide-react";
import { Button } from "@/ui/Button";

interface EmptyStateProps {
  onUploadClick: () => void;
}

export const EmptyState = ({ onUploadClick }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-[#2a3544] rounded-2xl p-12 flex flex-col items-center text-center space-y-6">
        <div className="w-32 h-32 bg-[#1e2837] rounded-xl flex items-center justify-center">
          <span className="text-4xl text-gray-600">No Videos</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">
            You haven&apos;t uploaded any videos yet
          </h3>
          <p className="text-gray-400 text-sm">
            Click &apos;Upload Video&apos; to get started and share your content with the world.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          // icon={<Upload className="w-5 h-5" />}
          onClick={onUploadClick}
        >
          Upload Video
        </Button>
      </div>
    </div>
  );
};
