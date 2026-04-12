import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPresignedUploadUrl, getS3Url } from "@/lib/s3";
import { v4 as uuid } from "uuid"

export async function POST(request) {
try{
    const user = await getCurrentUser()

    if(!user){
        return NextResponse.json(
            {success: false, message: "Not authenticated"},
            { status: 401}
        )
    }

    const {fileName, contentType, fileType } = await request.json()

    //Validate file type

    const allowedVideoTypes = ["video/mp4", "video/webm", "video/mov", "video/avi"]
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]
    const allowedType = [...allowedVideoTypes,...allowedImageTypes]

    if(!allowedType.includes(contentType)){
        return NextResponse.json(
            {success: false, message: "File type not allowed"},
            {status: 400}
        )
    }

    //Create unique key - prevent filename collisions
    const fileExtension = fileName.split(".").pop()
    const folder = fileType === "video" ? "videos" : "thumbnails"
    const key = `${folder}/${user.userId}/${uuid()}.${fileExtension}`

    //Generate presigned URL (valid for 1 hour)

    const presignedUrl = await getPresignedUploadUrl({
        key,
        contentType,
        expiresIn: 3600,
    })

    //The final URL where file will be accessible
    const fileUrl = getS3Url(key)

    return NextResponse.json({
        success: true,
        presignedUrl,
        fileUrl,
        key,
    })
} catch (error){
    console.error("Presigned URL error:", error)
    return NextResponse.json(
        { success: false, message: "Failed to generate upload URL"},
        {status: 500}
    )
}
}