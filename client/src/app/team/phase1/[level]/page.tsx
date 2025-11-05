"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ArrowUp } from 'lucide-react';

export default function Phase1LevelPage() {
  const router = useRouter();
  const params = useParams();
  const level = parseInt(params.level as string);
  const user = useAuthStore((state) => state.user);

  const [currentResponse, setCurrentResponse] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [guess, setGuess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "TEAM") {
      router.push("/");
    }
  }, [user, router]);
  
  const [error, setError] = useState("");

  const { data: levelData } = useQuery({
    queryKey: ["phase1-level", level],
    queryFn: async () => {
      const res = await api.get(`/team/phases/1/levels`);
      return res.data.levels.find((l: any) => l.levelNumber === level);
    },
  });

  const { data: contest } = useQuery({
    queryKey: ['contest-info'],
    queryFn: async () => {
      const res = await api.get('/leaderboard');
      return res.data.contest as { startTime: string; endTime: string } | null;
    },
    refetchInterval: 10000,
  });
  const contestEnded = !!contest && Date.now() >= new Date(contest.endTime).getTime();

  const sendPrompt = useMutation({
    mutationFn: async (promptText: string) => {
      // Check for duplicate prompt
      if (promptText.trim() === lastPrompt.trim()) {
        throw new Error("Prompt cannot be the same as the previous prompt.");
      }
      
      const res = await api.post(`/team/phase1/${level}/prompt`, { prompt: promptText });
      return res.data;
    },
    onSuccess: (data) => {
      setError("");
      // Handle response - extract the actual message content
      let responseContent = "";
      
      if (typeof data === "string") {
        responseContent = data;
      } else if (data.response) {
        if (typeof data.response === "string") {
          responseContent = data.response;
        } else if (typeof data.response === "object") {
          // If response is an object with a response property
          responseContent = data.response.response || data.response.message || data.response.content || JSON.stringify(data.response, null, 2);
        }
      } else if (data.message) {
        responseContent = data.message;
      } else {
        responseContent = JSON.stringify(data, null, 2);
      }

      // Replace the current response (no chat history)
      setCurrentResponse(responseContent);
      setLastPrompt(prompt);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message || "Failed to send prompt");
    },
  });

  const sendGuess = useMutation({
    mutationFn: async (guessText: string) => {
      const res = await api.post(`/team/phase1/${level}/guess`, { guess: guessText });
      return res.data;
    },
    onSuccess: (data) => {
      setError("");
      if (data.correct) {
        setShowSuccessModal(true);
      } else {
        alert(data.message);
        setGuess("");
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to submit guess");
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {levelData?.name || `Phase 1 - Level ${level}`}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{levelData?.description || "Password Retrieval"}</p>
            </div>
            <button
              onClick={() => router.push("/team")}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3.5 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* AI Response */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6 min-h-[250px]">
          {!currentResponse && !sendPrompt.isPending ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Ask the AI agent a question to retrieve the password
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">AI</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  AI Agent Response
                </p>
              </div>
              
              {/* Typing Animation */}
              {sendPrompt.isPending ? (
                <div className="flex items-center gap-1.5 py-4">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {currentResponse}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-all duration-200">
            <textarea
              className="w-full p-1.5 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none resize-none text-sm"
              rows={1}
              placeholder="Ask a question or provide an answer..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && !sendPrompt.isPending) {
                    sendPrompt.mutate(prompt);
                    setPrompt("");
                  }
                }
              }}
              disabled={sendPrompt.isPending || contestEnded}
            />
            {/* Controls */}
            <div className="flex justify-end mt-4">
              {/* Send Button */}
              <button 
                type="button"
                onClick={() => {
                  if (prompt.trim()) {
                    sendPrompt.mutate(prompt);
                    setPrompt("");
                  }
                }}
                disabled={sendPrompt.isPending || !prompt.trim() || contestEnded}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 ${
                  prompt.trim() 
                    ? 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Password Guess */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Submit Password Guess</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (guess.trim()) {
                sendGuess.mutate(guess);
              }
            }}
            className="flex gap-2.5"
          >
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your password guess..."
              className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all duration-200"
              disabled={sendGuess.isPending || contestEnded}
            />
            <button
              type="submit"
              disabled={sendGuess.isPending || !guess.trim() || contestEnded}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendGuess.isPending ? "Submitting..." : "Submit Guess"}
            </button>
          </form>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">⚠️ Wrong guesses add 10 minutes penalty</p>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Password Correct!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Congratulations! You've successfully retrieved the password and completed Level {level}.
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/team");
                  }}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
