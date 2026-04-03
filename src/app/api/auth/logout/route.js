// src/app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export async function POST(){
    const response = NextResponse.json(
        {success: true, message: "Logged out"},
        {status: 200}
    )
//Delete the cookie by setting maxAge to 0
response.cookies.set("token","",{
    httpOnly:true,
    maxAge: 0,
    path: "/",
})

return response
}