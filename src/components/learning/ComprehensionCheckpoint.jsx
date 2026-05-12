'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ComprehensionCheckpoint({
  contentId,
  chapterIndex,
  chapterTitle,
  isFirstWatch,
  onPass,
  onSkip,
  transcript,
}) {
  const [state, setState] = useState('loading') // loading, asking, scored, error
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [showSkip, setShowSkip] = useState(!isFirstWatch)
  const [error, setError] = useState('')

  // Fetch question on mount
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        // Use the provided transcript or a fallback
        const chapterTranscript = transcript?.substring(0, 2000) || ''

        const questionRes = await fetch(`/api/checkpoints/${contentId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterTitle,
            chapterTranscript,
          }),
        })

        if (!questionRes.ok) throw new Error('Failed to generate question')
        const { question: q } = await questionRes.json()

        setQuestion(q)
        setState('asking')

        // Show skip button after 5 seconds on first watch
        if (isFirstWatch) {
          setTimeout(() => setShowSkip(true), 5000)
        }
      } catch (err) {
        console.error('Error fetching question:', err)
        setError('Failed to load question. Please try again.')
        setState('error')
      }
    }

    fetchQuestion()
  }, [contentId, chapterTitle, isFirstWatch])

  // Submit answer for evaluation
  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer')
      return
    }

    setState('scoring')
    try {
      const evalRes = await fetch('/api/concepts/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: chapterTitle,
          question,
          answer,
        }),
      })

      if (!evalRes.ok) throw new Error('Failed to evaluate answer')
      const { score: s, feedback: f } = await evalRes.json()

      setScore(s)
      setFeedback(f)
      setState('scored')
    } catch (err) {
      console.error('Error evaluating answer:', err)
      setError('Failed to evaluate answer. Please try again.')
      setState('asking')
    }
  }

  // Handle continuing after scoring
  const handleContinue = async () => {
    try {
      // Mark checkpoint as passed in the backend
      await onPass(chapterIndex, score)
    } catch (err) {
      console.error('Error marking checkpoint passed:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Chapter Check-in</h2>
          <p className="text-blue-100">Let's verify your understanding of "{chapterTitle}"</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Generating question...</p>
            </div>
          )}

          {state === 'asking' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-gray-800 font-medium">{question}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Submit Answer
                </button>
                {showSkip && (
                  <button
                    onClick={onSkip}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 rounded-lg transition"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}

          {state === 'scoring' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Evaluating your answer...</p>
            </div>
          )}

          {state === 'scored' && (
            <div className="space-y-6">
              <div className="text-center">
                {score >= 60 ? (
                  <div className="space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-green-600">Great job!</h3>
                    <p className="text-gray-600">You've demonstrated a solid understanding of this chapter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-amber-600">Good effort!</h3>
                    <p className="text-gray-600">There are a few concepts to review.</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-100 p-6 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Score</span>
                  <span className="text-2xl font-bold text-blue-600">{Math.round(score)}/100</span>
                </div>
                <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      score >= 60 ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{feedback}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Continue Watching
                </button>
                {score < 60 && (
                  <button
                    onClick={onSkip}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 rounded-lg transition"
                  >
                    Skip for Now
                  </button>
                )}
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">{error}</p>
              <button
                onClick={onSkip}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
