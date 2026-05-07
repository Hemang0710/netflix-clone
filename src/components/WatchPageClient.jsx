"use client"

import { useRef, useState } from "react"
import VideoChapters from "./VideoChapters"
import QuizSection from "./QuizSection"
import FlashcardDeck from "./FlashcardDeck"
import DebateMode from "./DebateMode"
import AIChatSidebar from "./AIChatSidebar"
import NotesPanel from "./NotesPanel"
import ConceptMapPanel from "./ConceptMapPanel"
import CommentsSection from "./CommentsSection"
import DifficultyBadge from "./DifficultyBadge"
import TranscriptExplainer from "./TranscriptExplainer"
import StudyGroupPanel from "./StudyGroupPanel"
import { useVideoProgress } from "@/hooks/useVideoProgress"
import { useVideoConfusion } from "@/hooks/useVideoConfusion"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "notes",    label: "📝 Notes" },
  { id: "map",      label: "🗺 Map" },
  { id: "comments", label: "💬 Chat" },
  { id: "quiz",     label: "🧠 Quiz" },
  { id: "cards",    label: "🃏 Cards" },
  { id: "debate",   label: "⚔️ Debate" },
  { id: "study-groups", label: "👥 Groups" },
]

export default function WatchPageClient({ content, chapters, creatorName }) {
  const videoRef = useRef(null)
  const [activeTab, setActiveTab] = useState("overview")

  useVideoProgress(videoRef, content.id)
  const { confusionSignal, clearSignal } = useVideoConfusion(videoRef, chapters)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">

      {/* Video Player */}
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden mb-6 border border-white/5">
        <video
          ref={videoRef}
          src={content.videoUrl}
          controls
          className="w-full h-full"
          poster={content.thumbnailUrl || undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — Main content area */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + meta */}
          <div>
            <h1 className="text-2xl font-black tracking-tight mb-2">{content.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm">
              <span className="flex items-center gap-1">👁 {content.views.toLocaleString()} views</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-400 text-xs">{content.genre}</span>
              <span>{new Date(content.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              {content.isFree
                ? <span className="text-emerald-400 font-medium text-xs">Free</span>
                : <span className="text-amber-400 font-medium text-xs">${content.price}</span>}
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 pb-5 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white">
              {creatorName[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{creatorName}</p>
              <p className="text-slate-500 text-xs">Instructor</p>
            </div>
          </div>

          {/* Chapters (always visible if exist) */}
          {chapters.length > 0 && (
            <VideoChapters chapters={chapters} videoRef={videoRef} />
          )}

          {/* Difficulty badge */}
          <DifficultyBadge contentId={content.id} difficulty={content.difficulty} />

          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-white/3 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              (tab.id !== "quiz" && tab.id !== "cards" && tab.id !== "debate" && tab.id !== "notes" && tab.id !== "map") || content.transcript ? (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white glow-indigo-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ) : null
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {content.description && (
                <p className="text-slate-300 leading-relaxed text-sm">{content.description}</p>
              )}

              {content.aiSummary && (
                <div className="glass-card rounded-2xl p-5 border border-indigo-500/15">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                    ✨ AI Summary
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{content.aiSummary}</p>
                </div>
              )}

              {content.transcript && (
                <TranscriptExplainer
                  transcript={content.transcript}
                  videoTitle={content.title}
                />
              )}
            </div>
          )}

          {activeTab === "notes" && content.transcript && (
            <NotesPanel contentId={content.id} hasTranscript={!!content.transcript} videoRef={videoRef} />
          )}

          {activeTab === "map" && content.transcript && (
            <ConceptMapPanel contentId={content.id} transcript={content.transcript} videoTitle={content.title} />
          )}

          {activeTab === "comments" && (
            <CommentsSection contentId={content.id} />
          )}

          {activeTab === "quiz" && content.transcript && (
            <QuizSection contentId={content.id} hasTranscript={!!content.transcript} />
          )}

          {activeTab === "cards" && content.transcript && (
            <FlashcardDeck contentId={content.id} hasTranscript={!!content.transcript} />
          )}

          {activeTab === "debate" && content.transcript && (
            <DebateMode contentId={content.id} contentTitle={content.title} />
          )}

          {activeTab === "study-groups" && (
            <StudyGroupPanel contentId={content.id} />
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-sm">Lesson Details</h3>
          <div className="glass-card rounded-2xl p-4 space-y-3 text-sm">
            {[
              { label: "Genre",    value: content.genre },
              { label: "Access",   value: content.isFree ? "Free" : `$${content.price}` },
              { label: "Views",    value: content.views.toLocaleString() },
              { label: "Chapters", value: chapters.length > 0 ? `${chapters.length} chapters` : "None" },
              { label: "AI Ready", value: content.transcript ? "✅ Flashcards & Debate" : "⏳ Processing" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-white/4 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="text-white text-xs font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Feature quick-access cards */}
          {content.transcript && (
            <div className="space-y-2">
              {[
                { id: "quiz",   icon: "🧠", label: "Take Quiz",        sub: "Test your knowledge",   color: "indigo" },
                { id: "cards",  icon: "🃏", label: "Study Flashcards", sub: "SM-2 spaced repetition", color: "violet" },
                { id: "debate", icon: "⚔️", label: "Debate the AI",    sub: "Argue & be challenged",  color: "purple" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(f.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                    activeTab === f.id
                      ? "bg-indigo-500/15 border-indigo-500/30 text-white"
                      : "bg-white/3 border-white/6 text-slate-400 hover:text-white hover:border-white/12"
                  }`}
                >
                  <span className="mr-2">{f.icon}</span>
                  <span className="font-medium">{f.label}</span>
                  <p className="text-slate-600 text-xs mt-0.5 pl-6">{f.sub}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AIChatSidebar
        contentId={content.id}
        hasTranscript={!!content.transcript}
        videoTitle={content.title}
        videoTranscript={content.transcript || ""}
        confusionSignal={confusionSignal}
        onSignalAck={clearSignal}
      />
    </div>
  )
}
