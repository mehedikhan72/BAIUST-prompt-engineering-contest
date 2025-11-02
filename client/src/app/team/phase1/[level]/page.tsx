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
          {messages.length === 0 && !sendPrompt.isPending ? (
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
              {/* Typing Animation */}
              {sendPrompt.isPending && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 mr-12">
                  <p className="text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    AI Agent
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Prompt Input - Modern Design */}
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-white/80 backdrop-blur-xl dark:bg-black/90 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 transition-all duration-300 hover:shadow-3xl">
            <textarea
              className="w-full p-3 bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none text-base font-medium leading-relaxed"
              rows={2}
              placeholder="Chat with the AI agent to retrieve the password..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && !sendPrompt.isPending) {
                    // Add user message immediately
                    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
                    sendPrompt.mutate(prompt);
                    setPrompt("");
                  }
                }
              }}
              disabled={sendPrompt.isPending}
            />
            {/* Responsive container for controls */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4 md:gap-0">
              {/* Left side controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Add Button and Popup */}
                <div className="relative" ref={addPopupRef}>
                  <button 
                    type="button"
                    onClick={() => setAddPopupOpen(!isAddPopupOpen)}
                    className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Plus size={22} />
                  </button>
                  {isAddPopupOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-72 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-10">
                      <ul>
                        {addMenuItems.map((item, index) => (
                          <li key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 cursor-pointer rounded-xl transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl">
                            {item.icon}
                            <span className="font-medium text-gray-700 dark:text-gray-200">{item.text}</span>
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
                    className="flex items-center justify-center h-12 px-4 lg:px-5 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 hover:from-blue-100 hover:to-indigo-200 dark:hover:from-blue-800/40 dark:hover:to-indigo-700/40 text-gray-800 dark:text-gray-200 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-200/50 dark:border-blue-700/30"
                  >
                    <Brain size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold ml-2 hidden lg:block">{selectedModel}</span>
                    <ChevronDown size={16} className="ml-2 hidden lg:block" />
                  </button>
                  {isModelOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-64 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-10">
                      <ul>
                        {models.map((model) => (
                          <li key={model} onClick={() => handleModelSelect(model)} className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 cursor-pointer font-medium text-gray-700 dark:text-gray-200 rounded-xl transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl">
                            {model}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              {/* Right side controls */}
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => console.log("Mic clicked")} 
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700 text-gray-600 dark:text-gray-300 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <Mic size={22} />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (prompt.trim()) {
                      // Add user message immediately
                      setMessages((prev) => [...prev, { role: "user", content: prompt }]);
                      sendPrompt.mutate(prompt);
                      setPrompt("");
                    }
                  }}
                  disabled={sendPrompt.isPending || !prompt.trim()}
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                    prompt.trim() 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white' 
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp size={22} />
                </button>
              </div>
            </div>
          </div>
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
