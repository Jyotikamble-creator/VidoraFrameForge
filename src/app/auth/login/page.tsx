"use client"

import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">VidoraFrameForge</h1>
          <p className="text-gray-400">Welcome to the ultimate video sharing experience</p>
        </div>

        {/* Auth Form */}
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Share your videos with the world.
          </p>
        </div>
      </div>
    </div>
  );
}