"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Plus, ChevronDown, Mic, ArrowUp, Image as ImageIcon, Box, FileText, Brain } from 'lucide-react';

export default function Phase1LevelPage() {
  const router = useRouter();
  const params = useParams();
  const level = parseInt(params.level as string);
  const user = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [prompt, setPrompt] = useState("");
  const [guess, setGuess] = useState("");
  
  // State for popups and dropdowns
  const [isAddPopupOpen, setAddPopupOpen] = useState(false);
  const [isModelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Brainwave 2.5');
  
  // Refs for click-outside detection
  const addPopupRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role !== "TEAM") {
      router.push("/");
    }
  }, [user, router]);
  
  // Effect to handle clicks outside of the popups/dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addPopupRef.current && !addPopupRef.current.contains(event.target as Node)) {
        setAddPopupOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setModelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [error, setError] = useState("");
  
  const models = ['Brainwave 2.5', 'Creative Fusion', 'Visionary AI 3.0'];
  const addMenuItems = [
    { icon: <ImageIcon size={20} className="text-gray-500 dark:text-gray-400" />, text: "Add photos or videos" },
    { icon: <Box size={20} className="text-gray-500 dark:text-gray-400" />, text: "Add 3D objects" },
    { icon: <FileText size={20} className="text-gray-500 dark:text-gray-400" />, text: "Add files (docs, txt...)" },
  ];
  
  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setModelOpen(false);
  };

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

      // Only add AI response (user message was already added)
      setMessages((prev) => [...prev, { role: "assistant", content: responseContent }]);
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
  
  // Auto-scroll to bottom when a new message is added
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

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

        {/* Chat Messages */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          {messages.length === 0 && !sendPrompt.isPending ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Start chatting with the AI agent to retrieve the password
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${
                    msg.role === "user" 
                      ? "bg-slate-100 dark:bg-slate-800 ml-12 border border-slate-200 dark:border-slate-700" 
                      : "bg-slate-50 dark:bg-slate-800/50 mr-12 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <p className="text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {msg.role === "user" ? "You" : "AI Agent"}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
              {/* Typing Animation */}
              {sendPrompt.isPending && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 mr-12 border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    AI Agent
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-200">
            <textarea
              className="w-full p-3 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none resize-none text-base leading-relaxed"
              rows={2}
              placeholder="Chat with the AI agent to retrieve the password..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && !sendPrompt.isPending) {
                    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
                    sendPrompt.mutate(prompt);
                    setPrompt("");
                  }
                }
              }}
              disabled={sendPrompt.isPending}
            />
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4 md:gap-0">
              {/* Left side controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Add Button and Popup */}
                <div className="relative" ref={addPopupRef}>
                  <button 
                    type="button"
                    onClick={() => setAddPopupOpen(!isAddPopupOpen)}
                    className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-700"
                  >
                    <Plus size={20} />
                  </button>
                  {isAddPopupOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 z-10">
                      <ul>
                        {addMenuItems.map((item, index) => (
                          <li key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 dark:border-slate-800 last:border-0">
                            {item.icon}
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Model Selection Button and Dropdown */}
                <div className="relative" ref={modelRef}>
                  <button 
                    type="button"
                    onClick={() => setModelOpen(!isModelOpen)} 
                    className="flex items-center justify-center h-10 px-3 lg:px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-700"
                  >
                    <Brain size={18} className="text-slate-600 dark:text-slate-400" />
                    <span className="font-medium ml-2 hidden lg:block text-sm">{selectedModel}</span>
                    <ChevronDown size={16} className="ml-1.5 hidden lg:block" />
                  </button>
                  {isModelOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 z-10">
                      <ul>
                        {models.map((model) => (
                          <li key={model} onClick={() => handleModelSelect(model)} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium text-slate-700 dark:text-slate-300 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 dark:border-slate-800 last:border-0">
                            {model}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              {/* Right side controls */}
              <div className="flex items-center gap-2.5">
                <button 
                  type="button"
                  onClick={() => console.log("Mic clicked")} 
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-700"
                >
                  <Mic size={20} />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (prompt.trim()) {
                      setMessages((prev) => [...prev, { role: "user", content: prompt }]);
                      sendPrompt.mutate(prompt);
                      setPrompt("");
                    }
                  }}
                  disabled={sendPrompt.isPending || !prompt.trim()}
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
              disabled={sendGuess.isPending}
            />
            <button
              type="submit"
              disabled={sendGuess.isPending || !guess.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendGuess.isPending ? "Submitting..." : "Submit Guess"}
            </button>
          </form>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">⚠️ Wrong guesses add 10 minutes penalty</p>
        </div>
      </div>
    </div>
  );
}
