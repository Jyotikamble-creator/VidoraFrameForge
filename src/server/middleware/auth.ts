import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function authenticate(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return {
        authenticated: false,
        user: null,
        error: "No valid session found"
      };
    }

    const user: AuthenticatedUser = {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      role: token.role as string,
    };

    return {
      authenticated: true,
      user,
      error: null
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      authenticated: false,
      user: null,
      error: "Authentication failed"
    };
  }
}

export async function requireAuth(request: NextRequest) {
  const auth = await authenticate(request);
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  return auth.user;
}

export function createAuthResponse(error: string, status: number = 401) {
  return NextResponse.json({ error }, { status });
}
