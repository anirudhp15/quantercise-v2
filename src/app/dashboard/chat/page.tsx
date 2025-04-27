"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const ChatMessage = ({ role, content }: { role: string; content: string }) => (
  <motion.div
    variants={messageVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className={cn(
      "px-4 md:px-8 lg:px-16 xl:px-32 py-6 flex",
      role === "assistant"
        ? "bg-[#444654] text-white"
        : "bg-[#343541] text-white"
    )}
  >
    <div className="max-w-3xl mx-auto w-full flex gap-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
        {role === "assistant" ? (
          <div className="bg-[#10a37f] w-full h-full flex items-center justify-center text-white font-bold">
            AI
          </div>
        ) : (
          <div className="bg-[#8e79f3] w-full h-full flex items-center justify-center text-white font-bold">
            U
          </div>
        )}
      </div>
      <div className="flex-1 prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");
  const { theme } = useTheme();
  const router = useRouter();

  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages for an existing conversation
  useEffect(() => {
    if (conversationId) {
      // Fetch messages for this conversation
      // For now using placeholder data
      setMessages([
        {
          role: "assistant",
          content: `Welcome to ${
            theme === "student" ? "student" : "teacher"
          } mode! How can I help you today?`,
        },
      ]);
    } else {
      // New conversation
      setMessages([
        {
          role: "assistant",
          content: `Welcome to ${
            theme === "student" ? "student" : "teacher"
          } mode! How can I help you today?`,
        },
      ]);
    }
  }, [conversationId, theme]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "56px";
    }
    setIsLoading(true);
    setError(null);

    try {
      // Send the message to the API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: input,
          mode: theme,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Use router.push instead of window.location for client-side navigation
          router.push("/auth/login");
          return;
        }
        throw new Error(errorData.error || "Failed to send message");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      let assistantMessage = "";

      if (reader) {
        // Start with an empty assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and append to assistant message
          const text = new TextDecoder().decode(value);
          assistantMessage += text;

          // Update the last message with new content
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: assistantMessage,
            };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      // Remove the failed message from the UI
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#343541] text-white overflow-hidden">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
        </AnimatePresence>

        {/* Floating error message if there is an error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-0 right-0 mx-auto w-max max-w-md rounded-lg bg-red-500/90 px-4 py-2 text-white shadow-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Empty div for scroll reference */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="border-t border-gray-700 bg-[#343541] px-4 py-4">
        <div className="relative max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            className="w-full pl-4 pr-12 py-3 h-[56px] max-h-[200px] bg-[#40414f] rounded-lg border border-gray-700 focus:border-gray-500 focus:ring-0 resize-none text-white placeholder-gray-400 transition-all duration-200"
            placeholder="Message..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button
            className={cn(
              "absolute right-3 bottom-[13px] p-1 rounded-md transition-colors duration-200",
              input.trim()
                ? "text-white hover:bg-[#202123]"
                : "text-gray-400 cursor-not-allowed",
              isLoading && "pointer-events-none"
            )}
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-xs text-center mt-2 text-gray-400"
        >
          {theme === "student"
            ? "Ask questions about math and quantitative concepts to enhance your learning."
            : "Get help creating educational content and assessment materials."}
        </motion.p>
      </div>
    </div>
  );
}
