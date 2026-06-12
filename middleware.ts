import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl

        if (pathname.startsWith("/api/auth") || pathname === "/auth/login" || pathname === "/auth/signup") {
          return true
        }

        if (pathname === "/" || pathname.startsWith("/api/auth")) {
          return true
        }

        return !!token
      },
    },
  },
)

export const config = {
  // FIX: Fixed typo in matcher
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
