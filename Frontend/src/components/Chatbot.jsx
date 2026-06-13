import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CHAT_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";

const Chatbot = () => {
  const { user } = useSelector((store) => store.auth);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isAI, setIsAI] = useState(false);
  const messagesEndRef = useRef(null);
  const hasWelcomed = useRef(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isRecruiter = user?.role === "recruiter";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchWelcome = async () => {
    try {
      const res = await axios.get(`${CHAT_API_END_POINT}/welcome`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setMessages([{ role: "bot", content: res.data.reply }]);
        setSuggestions(res.data.suggestions || []);
        setIsAI(!!res.data.isAI);
      }
    } catch {
      setMessages([
        {
          role: "bot",
          content:
            "Hi! I'm the GetHired assistant. Ask me about verification, resumes, job applications, and more.",
        },
      ]);
      setSuggestions([
        "How do I verify my email?",
        "How to apply for jobs?",
        "What is trust score?",
      ]);
    }
  };

  useEffect(() => {
    if (isOpen && !hasWelcomed.current) {
      hasWelcomed.current = true;
      fetchWelcome();
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await axios.post(
        `${CHAT_API_END_POINT}/message`,
        {
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: res.data.reply },
        ]);
        setSuggestions(res.data.suggestions || []);
        setIsAI(!!res.data.isAI);
      }
    } catch {
      toast.error("Failed to get a response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (isAdminRoute || isRecruiter) return null;

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#6A38C2] text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">GetHired AI Assistant</p>
                <p className="text-xs text-purple-200">
                  {isAI ? "Powered by AI" : "Basic mode"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-[#F83002] text-white"
                      : "bg-purple-100 dark:bg-purple-900 text-[#6A38C2]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#6A38C2] text-white rounded-tr-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#6A38C2]" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-[#6A38C2]/30 text-[#6A38C2] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about jobs, profile, verification..."
              className="flex-1 text-sm"
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              size="icon"
              className="bg-[#6A38C2] hover:bg-[#5a2eb0] flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#6A38C2] hover:bg-[#5a2eb0] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label="Open student chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
};

export default Chatbot;
