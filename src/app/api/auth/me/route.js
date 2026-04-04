import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import EmailForm from "@/components/EmailForm";

export async function GET() {
    try{
        const user = await getCurrentUser()

        if(!user){
            return NextResponse.json(
                {success: false, message: "Not authenticated"},
                {status: 401}
            )
        }

        return NextResponse.json({
            success: true,
            email: user.email,
            userId: user.userId,
        })
    } catch (error){
        console.error("Me route error:", error)
        return NextResponse.json(
            {success:false, message:"Server error"},
            {status: 500}
        )
    }
    
}