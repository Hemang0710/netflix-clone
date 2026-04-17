"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect } from "react"

export default function AIChatSidebar({ contentId, hasTranscript }) {
  const [isOpen, setIsOpen] = useState(false)
  // v5/v6: manage input state yourself
  const [input, setInput] = useState("")
  const messagesEndRef = useRef(null)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ text: input })
    setInput("")
  }

  // Helper to get text from message parts
  function getMessageText(message) {
    if (message.parts) {
      return message.parts
        .filter(p => p.type === "text")
        .map(p => p.text)
        .join("")
    }
    // fallback for older format
    return message.content || ""
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-lg transition-all ${
          isOpen
            ? "bg-zinc-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {isOpen ? "✕ Close AI" : "✨ Ask AI"}
      </button>

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
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
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
            ))}

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

          {/* Suggested questions */}
          {messages.length === 1 && hasTranscript && (
            <div className="px-4 pb-2">
              <p className="text-zinc-500 text-xs mb-2">Try asking:</p>
              <div className="flex flex-col gap-1.5">
                {[
                  "Summarize the key points",
                  "Explain the main concept simply",
                  "What should I remember from this?",
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-left text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-zinc-700 flex gap-2"
          >
            <input
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