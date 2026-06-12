interface UploadProgressProps {
  fileName: string;
  progress: number;
}

export const UploadProgress = ({ fileName, progress }: UploadProgressProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-white font-medium">Uploading video...</h3>
          <p className="text-gray-400 text-sm">{fileName}</p>
        </div>
        <span className="text-purple-400 font-semibold">{progress}%</span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};