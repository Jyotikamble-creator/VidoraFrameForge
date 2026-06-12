import { authOptions } from "@/server/auth-config/auth"
import NextAuth from "next-auth"

export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


