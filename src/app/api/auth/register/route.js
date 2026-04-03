//src/app/api/auth/register/route.js

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma";

export async function POST(request){
    try {
        const{email,password} = await request.json()

        //Validate Input 

    if(!email || !password){
        return NextResponse.json(
            {success: false, message: "Email and password are required"},
            {status:400}
        )
        }

    if(password.length < 6){
        return NextResponse.json(
            {sucess:false, message : "Password must be at least 6 characters"},
            {status:400}
        )
    }

    //Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where:{email},
    })

    if(existingUser){
        return NextResponse.json(
            {success: false, message:"Email already registered"},
            {status: 409} //409 = Conflict
        )
    }

    //Hash password - NEVER store plain text
    //12 = salt rounds (higher = slower = more secure)
    const hashedPassword = await bcrypt.hash(password,12)

    //Create user in database
    const user = await prisma.user.create({
        data:{
            email,
            password: hashedPassword,
        },
    })

    return NextResponse.json(
        {
            success: true,
            message: "Account created successfully",
            userId: user.id,
        },
        {status:201} //201 = Created
    )

    } catch (error){
        console.error("Register error:", error)
        return NextResponse.json(
            {success: false, message: "Something went wrong"},
            {status: 500}
        )
    }
    
}




