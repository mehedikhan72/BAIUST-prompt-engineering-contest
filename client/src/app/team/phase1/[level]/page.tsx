"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function Phase1LevelPage() {
  const router = useRouter();
  const params = useParams();
  const level = parseInt(params.level as string);
  const user = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [prompt, setPrompt] = useState("");
  const [guess, setGuess] = useState("");

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

  const sendPrompt = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await api.post(`/team/phase1/${level}/prompt`, { prompt: promptText });
      return res.data;
    },
    onSuccess: (data) => {
      setError("");
      // Handle response - it could be an object or string
      let responseContent = "";
      if (typeof data.response === "string") {
        responseContent = data.response;
      } else if (data.response && typeof data.response === "object") {
        // Extract message from response object
        responseContent = data.response.message || data.response.content || JSON.stringify(data.response, null, 2);
      }

      setMessages((prev) => [...prev, { role: "user", content: prompt }, { role: "assistant", content: responseContent }]);
      setPrompt("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to send prompt");
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
        alert(`Correct! Level completed. Penalty added: ${data.penalty} minutes`);
        router.push("/team");
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {levelData?.name || `Phase 1 - Level ${level}`}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{levelData?.description || "Password Retrieval"}</p>
            </div>
            <button
              onClick={() => router.push("/team")}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Start chatting with the AI agent to retrieve the password
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg ${
                    msg.role === "user" ? "bg-blue-50 dark:bg-blue-900/20 ml-12" : "bg-gray-50 dark:bg-gray-700 mr-12"
                  }`}
                >
                  <p className="text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    {msg.role === "user" ? "You" : "AI Agent"}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Send Prompt to AI</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (prompt.trim()) {
                sendPrompt.mutate(prompt);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your prompt here..."
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              disabled={sendPrompt.isPending}
            />
            <button
              type="submit"
              disabled={sendPrompt.isPending || !prompt.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {sendPrompt.isPending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>

        {/* Password Guess */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Submit Password Guess</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (guess.trim()) {
                sendGuess.mutate(guess);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your password guess..."
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              disabled={sendGuess.isPending}
            />
            <button
              type="submit"
              disabled={sendGuess.isPending || !guess.trim()}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {sendGuess.isPending ? "Submitting..." : "Submit Guess"}
            </button>
          </form>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Wrong guesses add 10 minutes penalty</p>
        </div>
      </div>
    </div>
  );
}
