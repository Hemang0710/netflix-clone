"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function VideoUpload() {
    const [contentId, setContentId] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [aiDone, setAiDone] = useState(false)
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [videoUrl, setVideoUrl] = useState("")
    const [thumbnailUrl, setThumbnailUrl] = useState("")
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        genre: "General",
        price: "0",
    })
    const [error, setError] = useState("")
    const [fileInputKey, setFileInputKey] = useState(0)

    async function uploadFile(file, fileType) {
        // Determine content type - use file.type if available, otherwise infer from extension
        let contentType = file.type
        if (!contentType && fileType === "video") {
            const ext = file.name.split(".").pop().toLowerCase()
            const videoTypes = {
                mp4: "video/mp4",
                webm: "video/webm",
                mov: "video/quicktime",
                avi: "video/x-msvideo",
            }
            contentType = videoTypes[ext] || "video/mp4"
        } else if (!contentType && fileType === "thumbnail") {
            const ext = file.name.split(".").pop().toLowerCase()
            const imageTypes = {
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                png: "image/png",
                webp: "image/webp",
            }
            contentType = imageTypes[ext] || "image/jpeg"
        }

        const res = await fetch("/api/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: file.name,
                contentType,
                fileType,
            }),
        })

        const data = await res.json()
        if (!data.success) throw new Error(data.message)

        console.log("Presigned URL obtained, contentType:", contentType, "file size:", file.size)

        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100)
                    setProgress(percent)
                }
            })

            xhr.addEventListener("load", () => {
                console.log("XHR load event, status:", xhr.status)
                if (xhr.status === 200) {
                    setProgress(100)
                    resolve()
                } else {
                    console.error("Upload failed with status:", xhr.status, "response:", xhr.responseText)
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`))
                }
            })

            xhr.addEventListener("error", () => {
                console.error("XHR error event, response:", xhr.responseText)
                reject(new Error("Upload failed: Network error"))
            })

            xhr.addEventListener("abort", () => {
                console.error("XHR abort event")
                reject(new Error("Upload aborted"))
            })

            console.log("Opening PUT request to presigned URL, Content-Type:", contentType)
            xhr.open("PUT", data.presignedUrl)
            xhr.setRequestHeader("Content-Type", contentType)
            xhr.send(file)
        })

        return data.fileUrl
    }

    async function handleVideoSelect(e) {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024 * 1024) {
            setError("Video must be under 2GB")
            return
        }

        setUploading(true)
        setError("")
        setProgress(0)

        try {
            const url = await uploadFile(file, "video")
            console.log("Upload successful, URL:", url)
            setVideoUrl(url)
            setFileInputKey(prev => prev + 1)
            setStep(2)
        } catch (error) {
            console.error("Upload error:", error)
            setError("Video upload failed. Try again.")
        } finally {
            setUploading(false)
            setProgress(0)
        }
    }

    async function handleThumbnailSelect(e) {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        try {
            const url = await uploadFile(file, "thumbnail")
            setThumbnailUrl(url)
        } catch {
            setError("Thumbnail upload failed")
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        try {
            const res = await fetch("/api/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    videoUrl,
                    thumbnailUrl,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.message)
                return
            }

            setContentId(data.data.id)
            setStep(3)
        } catch {
            setError("Something went wrong")
        }
    }

    async function handleAIProcess() {
        setProcessing(true)
        try {
            const res = await fetch(`/api/content/${contentId}/process`, {
                method: "POST",
            })
            const data = await res.json()

            if (data.success) setAiDone(true)
            else setError("AI processing failed")
        } catch {
            setError("AI processing failed")
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-white text-3xl font-bold mb-8">
                Upload Content
            </h1>

            {/* Steps */}
            <div className="flex gap-4 mb-8">
                {["Upload Video", "Add Details", "Publish"].map((label, i) => (
                    <div
                        key={label}
                        className={`flex-1 text-center py-2 rounded text-sm font-semibold ${
                            step > i + 1
                                ? "bg-green-600 text-white"
                                : step === i + 1
                                ? "bg-red-600 text-white"
                                : "bg-zinc-800 text-zinc-400"
                        }`}
                    >
                        {step > i + 1 ? "✓ " : `${i + 1}.`} {label}
                    </div>
                ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center">
                    {uploading ? (
                        <div>
                            <p className="text-white mb-4">
                                Uploading video... {progress}%
                            </p>
                            <div className="w-full bg-zinc-700 rounded-full h-3">
                                <div
                                    className="bg-red-600 h-3 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-5xl mb-4">🎬</p>
                            <p className="text-white text-xl font-semibold mb-2">
                                Select your video
                            </p>
                            <p className="text-zinc-400 text-sm mb-6">
                                MP4, WebM up to 2GB
                            </p>
                            <label className={`font-bold px-8 py-3 rounded inline-block ${
                                uploading
                                    ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                            }`}>
                                Choose File
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoSelect}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-zinc-400 text-sm mb-2 block">
                            Thumbnail (optional)
                        </label>

                        {thumbnailUrl ? (
                            <Image
                                src={thumbnailUrl}
                                alt="Thumbnail"
                                width={200}
                                height={120}
                                className="rounded"
                            />
                        ) : (
                            <label className="block w-48 h-28 border-2 border-dashed border-zinc-600 rounded flex items-center justify-center cursor-pointer">
                                <span className="text-zinc-400 text-sm">
                                    + Add thumbnail
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailSelect}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Title *"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                title: e.target.value,
                            })
                        }
                        required
                        className="bg-zinc-800 text-white rounded px-4 py-3"
                    />

                    <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                        rows={4}
                        className="bg-zinc-800 text-white rounded px-4 py-3"
                    />

                    <select
                        value={formData.genre}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                genre: e.target.value,
                            })
                        }
                        className="bg-zinc-800 text-white rounded px-4 py-3"
                    >
                        {[
                            "General",
                            "Action",
                            "Comedy",
                            "Drama",
                            "Sci-Fi",
                            "Horror",
                            "Documentary",
                            "Education",
                        ].map((g) => (
                            <option key={g}>{g}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                price: e.target.value,
                            })
                        }
                        className="bg-zinc-800 text-white rounded px-4 py-3"
                    />

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        disabled={!formData.title || uploading || processing}
                        className={`py-3 rounded text-white font-semibold ${
                            !formData.title || uploading || processing
                                ? "bg-zinc-600 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                        {processing ? "Publishing..." : "Publish Content"}
                    </button>
                </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-white text-2xl font-bold mb-4">
                        Content Published Successfully!
                    </h2>

                    {/* Video Preview */}
                    {videoUrl && (
                        <div className="mb-6 rounded-lg overflow-hidden bg-black max-w-2xl mx-auto">
                            <video
                                controls
                                className="w-full h-auto max-h-96"
                                src={videoUrl}
                            >
                                Your browser doesn't support video playback
                            </video>
                        </div>
                    )}

                    <div className="space-y-4">
                        {!aiDone ? (
                            <button
                                onClick={handleAIProcess}
                                disabled={processing}
                                className={`w-full px-6 py-3 rounded font-semibold ${
                                    processing
                                        ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                            >
                                {processing
                                    ? "Processing AI Transcript..."
                                    : "Generate AI Transcript"}
                            </button>
                        ) : (
                            <p className="text-green-400 font-semibold">
                                ✅ AI processing complete
                            </p>
                        )}

                        <button
                            onClick={() =>
                                router.push(`/creator/dashboard?videoId=${contentId}`)
                            }
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold"
                        >
                            View in Dashboard →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}