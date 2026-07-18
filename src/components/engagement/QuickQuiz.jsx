"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function QuickQuiz({ contentId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/onboarding/quick-quiz?contentId=${contentId}`);
        const data = await res.json();

        if (data.alreadyTaken) {
          setResults({
            score: data.score,
            alreadyTaken: true,
            message: data.message,
          });
        } else {
          setQuiz(data.quiz);
          setAnswers(new Array(data.quiz.length).fill(null));
        }
      } catch (error) {
        console.error("Failed to fetch quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchQuiz();
    }
  }, [contentId]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNext = async () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion === quiz.length - 1) {
      // Submit quiz
      await submitQuiz(newAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const res = await fetch("/api/onboarding/quick-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          answers: finalAnswers.map((a, i) =>
            a ? String.fromCharCode(65 + quiz[i].options.indexOf(a)) : null
          ),
        }),
      });

      const data = await res.json();
      setResults(data);
      onComplete?.(data);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="h-6 bg-white/10 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (results) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/30"
      >
        {results.alreadyTaken ? (
          <div className="text-center space-y-3">
            <p className="text-3xl">📝</p>
            <p className="text-white font-bold">{results.message}</p>
            <p className="text-slate-400 text-sm">Score: {results.score}/100</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-center"
          >
            {/* Score Display */}
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="inline-block"
              >
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  {results.score}%
                </div>
              </motion.div>
              <p className="text-2xl font-bold">
                {results.passed ? "🎉 Great Job!" : "💪 Keep Learning!"}
              </p>
            </div>

            {/* AI Explanation */}
            {results.aiExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-sm text-slate-300">{results.aiExplanation}</p>
              </motion.div>
            )}

            {/* Next Action */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4 border-t border-white/10"
            >
              <p className="text-slate-400 text-sm mb-4">{results.nextAction}</p>
              <button
                onClick={() => window.location.href = "/learn"}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all"
              >
                Start Learning Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  const question = quiz[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/30"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-300">
            Question {currentQuestion + 1}/{quiz.length}
          </span>
          <span className="text-xs text-slate-500">5 min quiz</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
          />
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-bold text-white">{question.question}</h3>

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((option, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === option
                  ? "bg-indigo-500/30 border-indigo-500 text-white"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedAnswer === option
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-slate-500"
                  }`}
                >
                  {selectedAnswer === option && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        {currentQuestion > 0 && (
          <button
            onClick={() => {
              setCurrentQuestion(currentQuestion - 1);
              setSelectedAnswer(answers[currentQuestion - 1]);
            }}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-all"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
        >
          {currentQuestion === quiz.length - 1 ? "Submit" : "Next"} →
        </button>
      </div>
    </motion.div>
  );
}
