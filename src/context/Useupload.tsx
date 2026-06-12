"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface UploadContextType {
  progress: number
  setProgress: (value: number) => void
  uploading: boolean
  setUploading: (value: boolean) => void
}

const UploadContext = createContext<UploadContextType>({
  progress: 0,
  setProgress: () => {},
  uploading: false,
  setUploading: () => {},
})

export function UploadProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  return (
    <UploadContext.Provider value={{ progress, setProgress, uploading, setUploading }}>
      {children}
    </UploadContext.Provider>
  )
}

export const useUploadContext = () => useContext(UploadContext)
