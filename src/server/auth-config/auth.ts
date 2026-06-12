import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/server/db"
import * as bcrypt from "bcryptjs"
import { Logger, logger, LogTags, categorizeError, DatabaseError, ValidationError, AuthenticationError, ConnectionError } from "@/lib/logger"
import { isValidEmail } from "@/lib/validation"

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          Logger.w(LogTags.LOGIN, 'Login failed: missing email or password');
          throw new Error("Missing credentials")
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        logger.auth.loginAttempt(normalizedEmail);

        try {
          // Fetch user from PostgreSQL via Prisma
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          })

          if (!user) {
            Logger.w(LogTags.LOGIN, 'Login failed: user not found', { email: Logger.maskEmail(normalizedEmail) });
            return null
          }

          Logger.d(LogTags.LOGIN, 'User found, checking password', { userId: user.id, hasPassword: !!user.password });

          // Check if user has a password (defensive programming)
          if (!user.password) {
            Logger.w(LogTags.LOGIN, 'Login failed: user has no password set', { email: Logger.maskEmail(normalizedEmail) });
            throw new Error("ACCOUNT_INCOMPLETE")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          Logger.d(LogTags.LOGIN, 'Password validation result', { isValid: isPasswordValid });

          if (!isPasswordValid) {
            Logger.w(LogTags.LOGIN, 'Login failed: invalid password', { email: Logger.maskEmail(normalizedEmail) });
            return null
          }

          logger.auth.loginSuccess(user.id);

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username,
            role: user.role,
          }
        } catch (error) {
          Logger.e(LogTags.LOGIN, 'Login error details', { error: error });
          const categorizedError = categorizeError(error);
          Logger.d(LogTags.LOGIN, 'Categorized error type', { type: categorizedError.constructor.name, message: categorizedError.message });

          if (categorizedError instanceof DatabaseError) {
            Logger.e(LogTags.DB_ERROR, `Database error during login: ${categorizedError.message}`);
          } else if (categorizedError instanceof ConnectionError) {
            Logger.e(LogTags.DB_CONNECT, `Database unavailable during login: ${categorizedError.message}`);
            throw new Error("AUTH_SERVICE_UNAVAILABLE");
          } else if (categorizedError instanceof ValidationError) {
            Logger.e(LogTags.LOGIN, `Validation error during login: ${categorizedError.message}`);
          } else if (categorizedError instanceof AuthenticationError) {
            Logger.w(LogTags.LOGIN, `Authentication error during login: ${categorizedError.message}`);
            // Re-throw authentication errors so NextAuth passes them to the client
            throw categorizedError;
          } else {
            Logger.e(LogTags.LOGIN, `Unexpected error during login: ${categorizedError.message}`, { error: categorizedError });
          }

          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
