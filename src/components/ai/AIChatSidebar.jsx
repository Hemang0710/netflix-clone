"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect } from "react"
import VisualExplainer from "@/components/ai/visual/VisualExplainer"
import AnimatedVideoExplainer from "@/components/video/AnimatedVideoExplainer"
import SharedQuestionsPanel from "@/components/social/SharedQuestionsPanel"
import { generateQuestionSuggestions } from "@/lib/questionSuggestions"

const CONFUSION_PATTERNS = [
  /i don'?t (get|understand)/i,
  /i'?m confused/i,
  /what does .+ mean/i,
  /explain .+ again/i,
  /can you (show|explain)/i,
  /i don'?t follow/i,
  /not (clear|sure) (about|what)/i,
  /huh\??$/i,
]

function isConfusedMessage(text) {
  return CONFUSION_PATTERNS.some(re => re.test(text))
}

const EXPLAIN_TYPES = ["diagram", "analogy", "walkthrough"]

export default function AIChatSidebar({
  contentId,
  hasTranscript,
  videoTitle = "",
  videoTranscript = "",
  confusionSignal = null,   // { type, chapter, prefill } from useVideoConfusion
  onSignalAck = null,        // call to clear the signal after we've consumed it
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [confusedMsgIds, setConfusedMsgIds] = useState(new Set())
  const pendingConfusedText = useRef(null)

  const [visualMode, setVisualMode] = useState(null)
  const [visualContent, setVisualContent] = useState(null)
  const [visualLoading, setVisualLoading] = useState(false)
  const [visualError, setVisualError] = useState(null)

  // Video explanation state
  const [videoExplainerMode, setVideoExplainerMode] = useState(null)
  const [videoAnimation, setVideoAnimation] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)

  // feedback: null | 'up' | 'down' — resets when visual panel changes
  const [feedbackGiven, setFeedbackGiven] = useState(null)

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    body: { contentId },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: hasTranscript
              ? "👋 Hi! I've read the transcript of this video. Ask me anything about it!"
              : "👋 Hi! I'm your AI assistant. Ask me anything about this content.",
          },
        ],
      },
    ],
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Scroll to bottom on new messages or visual content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, visualContent])

  // When sidebar opens, consume the confusion signal: pre-fill input + ack
  useEffect(() => {
    if (isOpen && confusionSignal?.prefill) {
      setInput(confusionSignal.prefill)
      onSignalAck?.()
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen, confusionSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset feedback counter when a new visual panel is triggered
  useEffect(() => {
    setFeedbackGiven(null)
  }, [visualMode?.assistantMsgId])

  // Generate question suggestions based on video content
  useEffect(() => {
    const suggestions = generateQuestionSuggestions(videoTitle, videoTranscript)
    setSuggestedQuestions(suggestions)
  }, [videoTitle, videoTranscript])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()
    if (isConfusedMessage(text)) pendingConfusedText.current = text
    sendMessage({ text })
    setInput("")
    setVisualMode(null)
    setVisualContent(null)
    setVisualError(null)
    setFeedbackGiven(null)
  }

  // Match pending confused text to the real message id after list updates
  useEffect(() => {
    if (!pendingConfusedText.current) return
    const last = [...messages].reverse().find(m => m.role === "user")
    if (!last) return
    if (getMessageText(last) === pendingConfusedText.current) {
      setConfusedMsgIds(prev => new Set(prev).add(last.id))
      pendingConfusedText.current = null
    }
  }, [messages])

  function getMessageText(msg) {
    if (msg.parts) return msg.parts.filter(p => p.type === "text").map(p => p.text).join("")
    return msg.content || ""
  }

  function getPrecedingUserMsg(assistantIndex) {
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i]
    }
    return null
  }

  async function triggerVisual(assistantMsgId, concept, typeIndex = 0) {
    setVisualMode({ assistantMsgId, concept, typeIndex })
    setVisualContent(null)
    setVisualError(null)
    setVisualLoading(true)
    setFeedbackGiven(null)
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          videoTranscript: videoTranscript.slice(0, 3000),
          videoTitle,
          explanationType: EXPLAIN_TYPES[typeIndex % EXPLAIN_TYPES.length],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to generate visual")
      setVisualContent(data.data)
    } catch (err) {
      setVisualError(err.message)
    } finally {
      setVisualLoading(false)
    }
  }

  function handleTryDifferent() {
    if (!visualMode) return
    triggerVisual(
      visualMode.assistantMsgId,
      visualMode.concept,
      (visualMode.typeIndex + 1) % EXPLAIN_TYPES.length
    )
  }

  function handleFollowUp(prompt) {
    setInput(prompt)
    setVisualMode(null)
    setVisualContent(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSelectSuggestion(suggestion) {
    // Set input and auto-send
    setInput(suggestion)
    setVisualMode(null)
    setVisualContent(null)
    setVisualError(null)
    setFeedbackGiven(null)
    
    // Auto-send after a brief delay to ensure input is updated
    setTimeout(() => {
      sendMessage({ text: suggestion })
    }, 50)
  }

  function handleGotIt() {
    sendFeedback(true)
    setVisualMode(null)
    setVisualContent(null)
  }

  async function sendFeedback(helpful) {
    if (feedbackGiven) return
    setFeedbackGiven(helpful ? "up" : "down")
    try {
      await fetch("/api/ai/explain/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          concept: visualMode?.concept || "",
          type: EXPLAIN_TYPES[((visualMode?.typeIndex) || 0) % EXPLAIN_TYPES.length],
          helpful,
        }),
      })
    } catch {
      // feedback is non-critical, silently fail
    }
    if (!helpful) {
      // Auto-try the next explanation type
      setTimeout(handleTryDifferent, 400)
    }
  }

  async function triggerVideoExplanation(topic, assistantMsgId) {
    setVideoExplainerMode({ topic, assistantMsgId })
    setVideoAnimation(null)
    setVideoLoading(true)
    try {
      const res = await fetch("/api/ai/video-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: topic,
          videoTitle,
          contentId,
          context: videoTranscript.slice(0, 2000),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate video")
      setVideoAnimation(data.animation)
    } catch (err) {
      console.error("Video explanation error:", err)
      alert(`Failed to generate video: ${err.message}`)
    } finally {
      setVideoLoading(false)
    }
  }

  // True when there's an unacknowledged confusion signal and sidebar is closed
  const showSignalBadge = !!confusionSignal && !isOpen

  return (
    <>
      {/* Toggle button — pulses when a confusion signal is pending */}
      <div className="fixed bottom-6 right-6 z-50">
        {showSignalBadge && (
          <div className="absolute -top-10 right-0 whitespace-nowrap bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs px-3 py-1.5 rounded-full shadow-lg">
            Rewound "{confusionSignal.chapter}"? Need help? 👆
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-lg transition-all ${
            isOpen
              ? "bg-zinc-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          } ${showSignalBadge ? "ring-2 ring-red-400 ring-offset-2 ring-offset-zinc-950" : ""}`}
        >
          {isOpen ? "✕ Close AI" : "✨ Ask AI"}
          {showSignalBadge && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-zinc-900 border-l border-zinc-700 z-40 flex flex-col shadow-2xl">

          {/* Header */}
          <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">✨ AI Assistant</h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                {hasTranscript ? "Knows this video" : "General assistant"}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white text-xl">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => {
              const isAssistant = message.role === "assistant"
              const preceding = isAssistant ? getPrecedingUserMsg(idx) : null
              // Show buttons for all assistant messages (not just confused ones)
              const showVisualBtn = isAssistant && preceding && !isLoading
              const showVideoBtn = isAssistant && preceding && !isLoading && !videoLoading
              const isActiveVisual = visualMode?.assistantMsgId === message.id

              return (
                <div key={message.id}>
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-red-600 text-white rounded-br-sm"
                          : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                      }`}
                    >
                      {getMessageText(message)}
                    </div>
                  </div>

                  {/* Visual explainer trigger button */}
                  {showVisualBtn && (
                    <div className="mt-2 ml-1 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const assistantText = getMessageText(message)
                          const concept =
                            assistantText.length > 80
                              ? assistantText.slice(0, 300)
                              : videoTitle || getMessageText(preceding)
                          triggerVisual(message.id, concept, 0)
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/60 border border-red-800/50 px-3 py-1.5 rounded-full transition-all"
                      >
                        ✨ Show me visually
                      </button>

                      <button
                        onClick={() => {
                          const topic = getMessageText(message).slice(0, 100)
                          triggerVideoExplanation(topic, message.id)
                        }}
                        disabled={videoLoading}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-800/50 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                      >
                        {videoLoading ? "🎬 Generating..." : "🎬 Animated video"}
                      </button>
                    </div>
                  )}

                  {/* Visual panel */}
                  {isActiveVisual && (
                    <div className="mt-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 space-y-3">
                      {visualLoading && (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
                          <span className="animate-spin inline-block">⟳</span>
                          Generating {EXPLAIN_TYPES[visualMode.typeIndex % EXPLAIN_TYPES.length]} explanation…
                        </div>
                      )}

                      {visualError && (
                        <p className="text-red-400 text-xs">{visualError}</p>
                      )}

                      {visualContent && !visualLoading && (
                        <>
                          <VisualExplainer
                            data={visualContent}
                            onTryDifferent={handleTryDifferent}
                            onFollowUp={handleFollowUp}
                            onGotIt={handleGotIt}
                          />

                          {/* Feedback row */}
                          {feedbackGiven === null && (
                            <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                              <span className="text-zinc-500 text-xs">Did this help?</span>
                              <button
                                onClick={() => sendFeedback(true)}
                                className="text-sm hover:scale-110 transition-transform"
                                title="Yes, helpful"
                              >
                                👍
                              </button>
                              <button
                                onClick={() => sendFeedback(false)}
                                className="text-sm hover:scale-110 transition-transform"
                                title="No, try differently"
                              >
                                👎
                              </button>
                            </div>
                          )}

                          {feedbackGiven === "up" && (
                            <p className="text-emerald-400 text-xs pt-2 border-t border-zinc-800">
                              Glad it helped! ✓
                            </p>
                          )}

                          {feedbackGiven === "down" && (
                            <p className="text-zinc-400 text-xs pt-2 border-t border-zinc-800 flex items-center gap-1">
                              <span className="animate-spin inline-block">⟳</span>
                              Trying a different approach…
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Animated Video Explainer */}
                  {videoExplainerMode?.assistantMsgId === message.id && videoAnimation && (
                    <div className="mt-3">
                      <AnimatedVideoExplainer
                        animation={videoAnimation}
                        onClose={() => {
                          setVideoExplainerMode(null)
                          setVideoAnimation(null)
                        }}
                      />
                    </div>
                  )}

                  {/* Video loading state */}
                  {videoExplainerMode?.assistantMsgId === message.id && videoLoading && (
                    <div className="mt-3 bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-zinc-400">
                        <span className="animate-spin inline-block text-lg">🎬</span>
                        <span className="text-sm">Creating animated explanation...</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <span
                        key={delay}
                        className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                <p className="text-red-400 text-xs">
                  {error.message || "Something went wrong. Try again."}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Shared Questions */}
          <div className="px-4 py-2">
            <SharedQuestionsPanel contentId={contentId} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 2 && suggestedQuestions.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-zinc-500 text-xs mb-2 font-semibold">💡 Try asking:</p>
              <div className="flex flex-col gap-1.5">
                {suggestedQuestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="text-left text-xs text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-all border border-zinc-700/50 hover:border-zinc-600 active:scale-95"
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-700 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about this video..."
              disabled={isLoading}
              className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  )
}
