import type { DefaultSession } from "next-auth";
import NextAuth from "next-auth/next";

import { OPTIONS } from "./nextAuthOptions";

declare module "next-auth" {
    interface Session extends DefaultSession {
        accessToken?: string;
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
    }
}

const handler = NextAuth(OPTIONS);
export { handler as GET, handler as POST };
