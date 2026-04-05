import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma";

export async function POST (request){
    try {
        const body = await request.json()
        const {email,password} = body 

        if(!email || !password) {
            return NextResponse.json (
                {success : false, message: "Email and password are required"},
                {status: 400}
            
            )
        }

        //Find user by email
        const user = await prisma.user.findUnique({
            where: {email},
        })

        //User not found - same message as wrong password (security reason!)
        if(!user){
            return NextResponse.json (
                {success :false, message: "Invalid email or password"},
                {status: 401}

            )
        }
    

    //Compare entered password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password)

    if(!passwordMatch){
        return NextResponse.json(
            {success:false, message: "Invalid email or password"},
            {status:401}
        )
    }

    //Create JWT token
    const token = jwt.sign(
        {userId: user.id,email:user.email}, //payload
        process.env.JWT_SECRET, // secret
        {expiresIn:"7d"}  //expires in 7 days
    )

    //Send token in HTTP-only cookie
    const response = NextResponse.json(
        {success: true, message:"Logged in successfully"},
        {status: 200}
    )

    response.cookies.set("token", token, {
        httpOnly: true,   //JS cannot read this
        secure: true, //HTTPS only in prod
        sameSite: "lax",   //CSRF protection
        maxAge: 60*60*24*7,  //7 days in seconds
        path: "/",
    })

    return response

} catch (error){
    console.error("LOGIN ERROR:", error)
    return NextResponse.json(
        {success:false, message: "Something went wrong"},
        {status: 500}
    )
}
}