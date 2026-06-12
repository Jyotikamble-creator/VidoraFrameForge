"use client"

interface LoaderProps {
  message?: string
  fullscreen?: boolean
}

export default function Loader({ message = "Loading...", fullscreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600/20"></div>
        <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-transparent border-t-purple-600 animate-spin"></div>
      </div>
      <p className="text-gray-300 text-sm font-medium">{message}</p>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  )
}