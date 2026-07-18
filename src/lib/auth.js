// Server-side auth helpers for route handlers and server components.
// Note: deliberately NOT marked "use server" — that would expose these
// as client-invokable Server Actions.
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function getCurrentUser(){
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if(!token) return null

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const {payload} = await jwtVerify(token,secret)
        return payload //{userId,email}
    }
    catch {
        return null
    }
}

export async function verifyAuth() {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error("Unauthorized")
    }
    return user
}