"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/UseTheme"
import { PWAInstaller } from "./PWAInstaller"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>
          <PWAInstaller />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  )
}