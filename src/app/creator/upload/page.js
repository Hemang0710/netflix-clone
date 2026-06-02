import VideoUpload from "@/components/video/VideoUpload";
import Navbar from "@/components/layout/Navbar";

export default function UploadPage(){
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-zinc-950 pt-8">
                <VideoUpload />
            </main>
        </>
    )
}