"use client"

import { Suspense } from "react"
import SearchContent from "./SearchContent"

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-white">Loading search...</div></div>}>
      <SearchContent />
    </Suspense>
  )
}