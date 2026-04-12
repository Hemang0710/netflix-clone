import { NextResponse } from "next/server";
import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma";

export async function GET(request) {
    const {searchParams} = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    // User denied access
    if(error || !code){
        return NextResponse.redirect (
            new URL("/login?error=google_denied", request.url)
        )
    }

    try {
        // Step 1 - Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token",{
            method: "POST",
            headers:{"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`,
                grant_type: "authorization_code",
                code,
            }),
        })

        const tokens = await tokenResponse.json()

        if(!token.access_token) {
            throw new Error("No access token received from Google")
        }

        //Step 2 - Get user info from Google
        const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {Authorization: `Bearer ${token.access_token}`},
            }
        )

        const googleUser = await userInfoResponse.json()
        //googleUser = {id, email, name, picture, verified_email}

        if(!googleUser.email || !googleUser.verified_email){
            throw new Error("Google email not verified")
        }

        //Step 3 - Find or create user in your database
        let user = await prisma.user.findUnique({
            where: {email: googleUser.email},
        })

        if(!user){
            //New user - create account (no password for OAuth users)
            user = await prisma.user.create ({
                data: {
                    email:googleUser.email,
                    password: null, // OAuth users have no password
                    role: "viewer",
                },
            })

            //Create profile with Google name and avatar
            await prisma.profile.create({
                data: {
                    userId: user.id,
                    name: googleUser.name || googleUser.email.split("@")[0],
                    avatarUrl: googleUser.picture || null,
                },
            })
        }

        //Step 4 - Create YOUR JWT (same as email/password login)
        const token = jwt.sign(
            {userId: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        )

        // Step 5 - Set YOUR cookie (same as email/password login)
        const response = NextResponse.redirect(
            new URL("/browse", request.url)
        )

        response.cookies.set("token", token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        })

        return response
    } catch (error) {
        console.error("Google OAuth error:", error.message)
        return NextResponse.redirect(
            new URL("/login?error=google_failed", request.url)
        )
    }
    
}