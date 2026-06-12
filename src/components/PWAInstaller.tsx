"use client"

import { useEffect } from "react"
import { Logger, LogTags } from "@/lib/logger"

export function PWAInstaller() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          Logger.i(LogTags.AUTH, "Service Worker registered successfully")
          console.log("Service Worker registered:", registration)
        })
        .catch((error) => {
          Logger.e(LogTags.AUTH, "Service Worker registration failed", { error })
          console.error("Service Worker registration failed:", error)
        })
    }
  }, [])

  return null
}
