export const dynamic = 'force-dynamic';
import { authOptions } from "@/server/auth-config/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


