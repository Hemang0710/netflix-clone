// src/components/QuizSection.jsx
"use client"

import { useState } from "react"

export default function QuizSection({ contentId, hasTranscript }) {
  const [state, setState] = useState("idle") // idle | loading | taking | result
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  async function loadOrGenerateQuiz() {
    setState("loading")
    setError("")

    try {
      // Try to fetch existing quiz first
      let res = await fetch(`/api/content/${contentId}/quiz`)

      if (res.status === 404) {
        // Generate new quiz
        res = await fetch(`/api/content/${contentId}/quiz`, { method: "POST" })
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.message || "Failed to load quiz")
        setState("idle")
        return
      }

      setQuestions(data.questions)
      setState("taking")

    } catch {
      setError("Something went wrong")
      setState("idle")
    }
  }

  async function submitQuiz() {
    setState("loading")

    try {
      const res = await fetch(`/api/content/${contentId}/quiz/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, questions }),
      })

      const data = await res.json()
      setResult(data)
      setState("result")

    } catch {
      setError("Failed to submit quiz")
      setState("taking")
    }
  }

  if (!hasTranscript) return null

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">

      {/* Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            🧠 Knowledge Quiz
          </h3>
          <p className="text-zinc-400 text-sm mt-0.5">
            Test what you learned from this video
          </p>
        </div>
        {state === "idle" && (
          <button
            onClick={loadOrGenerateQuiz}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Start Quiz
          </button>
        )}
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="p-8 text-center">
          <div className="animate-spin text-3xl mb-3">⚙️</div>
          <p className="text-zinc-400">Generating your quiz...</p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm p-4">{error}</p>
      )}

      {/* Quiz Questions */}
      {state === "taking" && (
        <div className="p-6 space-y-6">
          {questions.map((q, qIndex) => (
            <div key={qIndex}>
              <p className="text-white font-semibold mb-3">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
                      answers[qIndex] === oIndex
                        ? "bg-red-600/20 border-red-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-xs mr-3 text-zinc-500">
                      {["A", "B", "C", "D"][oIndex]}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={submitQuiz}
            disabled={Object.keys(answers).length < questions.length}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
          >
            {Object.keys(answers).length < questions.length
              ? `Answer all questions (${Object.keys(answers).length}/${questions.length})`
              : "Submit Quiz"}
          </button>
        </div>
      )}

      {/* Results */}
      {state === "result" && result && (
        <div className="p-6">
          {/* Score */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-black mb-2 ${
              result.score >= 80 ? "text-green-400" :
              result.score >= 60 ? "text-yellow-400" : "text-red-400"
            }`}>
              {result.score}%
            </div>
            <p className="text-zinc-300">
              {result.correct} of {result.total} correct
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              {result.score >= 80 ? "🎉 Excellent!" :
               result.score >= 60 ? "👍 Good job!" : "📚 Keep learning!"}
            </p>
          </div>

          {/* Answer Review */}
          <div className="space-y-4">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct
              return (
                <div
                  key={i}
                  className={`rounded-lg p-4 border ${
                    isCorrect
                      ? "bg-green-900/20 border-green-700"
                      : "bg-red-900/20 border-red-700"
                  }`}
                >
                  <p className="text-white text-sm font-semibold mb-2">
                    {isCorrect ? "✅" : "❌"} {q.question}
                  </p>
                  <p className="text-zinc-400 text-xs">
                    Correct: {q.options[q.correct]}
                  </p>
                  {q.explanation && (
                    <p className="text-zinc-500 text-xs mt-1 italic">
                      {q.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => {
              setState("idle")
              setAnswers({})
              setResult(null)
            }}
            className="w-full mt-6 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}