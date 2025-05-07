import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";

import { getEnv } from "@/helpers/getEnv";
const r = getEnv([
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SPOTIFY_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET",
]);

if (r.isErr()) throw r.error;
const [
    googleClientId,
    googleClientSecret,
    spotifyClientId,
    spotifyClientSecret,
] = r.value;

export const OPTIONS: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        SpotifyProvider({
            clientId: spotifyClientId,
            clientSecret: spotifyClientSecret,
            authorization: {
                params: {
                    scope: [
                        "playlist-read-private",
                        "playlist-modify-private",
                        "playlist-modify-public",
                    ].join(" "),
                },
            },
        }),
        GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
                params: {
                    scope: [
                        "https://www.googleapis.com/auth/youtube",
                        "https://www.googleapis.com/auth/userinfo.profile",
                        "https://www.googleapis.com/auth/userinfo.email",
                    ].join(" "),
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                // @ts-expect-error
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.provider = token.provider;
            return session;
        },
    },
};
