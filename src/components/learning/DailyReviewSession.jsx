'use client'

import { useState, useEffect } from 'react'
import { Loader2, BookOpen, BarChart3, CheckCircle2 } from 'lucide-react'

export default function DailyReviewSession({ dueCount = 0 }) {
  const [state, setState] = useState('idle') // idle, loading, reviewing, done
  const [session, setSession] = useState(null)
  const [dueConcepts, setDueConcepts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [quality, setQuality] = useState(null)
  const [sessionStats, setSessionStats] = useState({
    conceptsReviewed: 0,
    scores: [],
    startTime: null,
  })

  const currentConcept = dueConcepts[currentIndex]

  const startSession = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/review-session', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start session')

      const { session: s, dueConcepts: dc } = await res.json()
      setSession(s)
      setDueConcepts(dc)
      setSessionStats({
        conceptsReviewed: 0,
        scores: [],
        startTime: Date.now(),
      })

      if (dc.length > 0) {
        setState('reviewing')
        generateQuestion(dc[0])
      } else {
        setState('done')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      setState('idle')
    }
  }

  const generateQuestion = async (concept) => {
    try {
      // For daily review, we use the evaluate endpoint to generate a question
      // The question generation is implicit in the concept evaluation
      // So we just prompt the user with the concept
      setQuestion(`Explain what you've learned about: ${concept.concept}`)
      setAnswer('')
      setScore(null)
      setFeedback('')
      setQuality(null)
    } catch (error) {
      console.error('Error generating question:', error)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return

    try {
      const res = await fetch('/api/concepts/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: currentConcept.concept,
          question,
          answer,
        }),
      })

      if (!res.ok) throw new Error('Failed to evaluate')
      const { score: s, feedback: f } = await res.json()

      setScore(s)
      setFeedback(f)
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const rateResponse = async (q) => {
    setQuality(q)

    try {
      // Apply SM-2 algorithm
      const res = await fetch(`/api/concepts/${currentConcept.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality: q,
          score,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit rating')

      // Track stats
      setSessionStats((prev) => ({
        ...prev,
        conceptsReviewed: prev.conceptsReviewed + 1,
        scores: [...prev.scores, score],
      }))

      // Move to next concept
      const nextIdx = currentIndex + 1
      if (nextIdx < dueConcepts.length) {
        setCurrentIndex(nextIdx)
        generateQuestion(dueConcepts[nextIdx])
      } else {
        completeSession()
      }
    } catch (error) {
      console.error('Error rating response:', error)
    }
  }

  const completeSession = async () => {
    setState('done')

    try {
      const duration = Math.round((Date.now() - sessionStats.startTime) / 1000)
      const avgScore =
        sessionStats.scores.length > 0
          ? Math.round(
              sessionStats.scores.reduce((a, b) => a + b, 0) / sessionStats.scores.length
            )
          : 0

      if (session) {
        await fetch(`/api/review-session/${session.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            avgScore,
            conceptsReviewed: sessionStats.conceptsReviewed,
            durationSeconds: duration,
          }),
        })
      }
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  if (dueCount === 0 && state === 'idle') {
    return (
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
        <div className="flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-600">No concepts are due for review right now.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Daily Review</h3>
              <p className="text-sm text-gray-600">{dueCount} concepts due today</p>
            </div>
          </div>
          <button
            onClick={startSession}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition whitespace-nowrap"
          >
            Start Review
          </button>
        </div>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center min-h-300px">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading your review session...</p>
      </div>
    )
  }

  if (state === 'reviewing' && currentConcept) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Concept {currentIndex + 1} of {dueConcepts.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / dueConcepts.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${((currentIndex + 1) / dueConcepts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Concept header */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentConcept.concept}</h3>

        {/* Question */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-gray-800">{question}</p>
        </div>

        {/* Answer input */}
        {score === null && (
          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={submitAnswer}
              disabled={!answer.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* Score display */}
        {score !== null && (
          <div className="space-y-6">
            {/* Score */}
            <div className="bg-gray-100 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-medium">Score</span>
                <span className="text-3xl font-bold text-blue-600">{Math.round(score)}</span>
              </div>
              <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${score >= 60 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">{feedback}</p>
            </div>

            {/* Rating buttons */}
            {quality === null && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">How well did you understand this?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => rateResponse(0)}
                    className="py-2 px-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition"
                  >
                    Unclear
                  </button>
                  <button
                    onClick={() => rateResponse(1)}
                    className="py-2 px-3 text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium rounded-lg transition"
                  >
                    Somewhat Clear
                  </button>
                  <button
                    onClick={() => rateResponse(2)}
                    className="py-2 px-3 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => rateResponse(3)}
                    className="py-2 px-3 text-sm bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition"
                  >
                    Very Clear
                  </button>
                </div>
              </div>
            )}

            {quality !== null && (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Moving to next concept...</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (state === 'done') {
    const avgScore =
      sessionStats.scores.length > 0
        ? Math.round(sessionStats.scores.reduce((a, b) => a + b, 0) / sessionStats.scores.length)
        : 0
    const duration = sessionStats.startTime
      ? Math.round((Date.now() - sessionStats.startTime) / 1000)
      : 0

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Complete!</h3>
        <p className="text-gray-600 mb-6">Great job reviewing your concepts today.</p>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{sessionStats.conceptsReviewed}</p>
            <p className="text-xs text-gray-600 mt-1">Concepts Reviewed</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{avgScore}</p>
            <p className="text-xs text-gray-600 mt-1">Avg Score</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{Math.round(duration / 60)}m</p>
            <p className="text-xs text-gray-600 mt-1">Time Spent</p>
          </div>
        </div>

        <button
          onClick={() => setState('idle')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return null
}
