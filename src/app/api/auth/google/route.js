import { NextResponse } from "next/server";

export async function GET() {
    //Build Google OAuth URL
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "select_account", //always show account picker
    })

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

    return NextResponse.redirect(googleAuthUrl)
}