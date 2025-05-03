import React, { useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as Select from "@radix-ui/react-select";
import {
  Check,
  ChevronDown,
  Presentation,
  File,
  Book,
  FileSpreadsheet,
  CalendarCheck,
  ListChecks,
  BookOpen,
  Puzzle,
  FileText,
  ClipboardList,
  CheckSquare,
  FileCheck,
} from "lucide-react";

interface HighlightedInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showInstructions?: boolean;
  onShowInstructionsChange?: (show: boolean) => void;
  onSettingsChange?: (settings: LessonSettings) => void;
}

interface LessonSettings {
  contentType: string;
  gradeLevel: string;
  length: string;
  tone: string;
}

// Content type options
const CONTENT_TYPES = [
  {
    value: "slideshow",
    label: "Slideshow",
    shortLabel: "Slides",
    icon: <Presentation />,
  },
  {
    value: "worksheet",
    label: "Worksheet",
    shortLabel: "Worksheet",
    icon: <FileSpreadsheet />,
  },
  {
    value: "lesson_plan",
    label: "Lesson Plan",
    shortLabel: "Lesson",
    icon: <BookOpen />,
  },
  {
    value: "quiz",
    label: "Quiz",
    shortLabel: "Quiz",
    icon: <CheckSquare />,
  },
  {
    value: "test",
    label: "Test",
    shortLabel: "Test",
    icon: <FileCheck />,
  },
  {
    value: "study_guide",
    label: "Study Guide",
    shortLabel: "Guide",
    icon: <Book />,
  },
  {
    value: "activity",
    label: "Interactive Activity",
    shortLabel: "Activity",
    icon: <Puzzle />,
  },
  {
    value: "notes",
    label: "Lecture Notes",
    shortLabel: "Notes",
    icon: <FileText />,
  },
  {
    value: "homework",
    label: "HW Assignment",
    shortLabel: "HW",
    icon: <ClipboardList />,
  },
];

// Grade level options
const GRADE_LEVELS = [
  { value: "pk", label: "Pre-Kindergarten", shortLabel: "Pre-K" },
  { value: "k", label: "Kindergarten", shortLabel: "K" },
  { value: "1", label: "1st Grade", shortLabel: "1st" },
  { value: "2", label: "2nd Grade", shortLabel: "2nd" },
  { value: "3", label: "3rd Grade", shortLabel: "3rd" },
  { value: "4", label: "4th Grade", shortLabel: "4th" },
  { value: "5", label: "5th Grade", shortLabel: "5th" },
  { value: "6", label: "6th Grade", shortLabel: "6th" },
  { value: "7", label: "7th Grade", shortLabel: "7th" },
  { value: "8", label: "8th Grade", shortLabel: "8th" },
  { value: "9", label: "9th Grade", shortLabel: "9th" },
  { value: "10", label: "10th Grade", shortLabel: "10th" },
  { value: "11", label: "11th Grade", shortLabel: "11th" },
  { value: "12", label: "12th Grade", shortLabel: "12th" },
  { value: "undergraduate", label: "Undergraduate", shortLabel: "Undergrad" },
  { value: "graduate", label: "Graduate", shortLabel: "Grad" },
];

// Length options
const LENGTH_OPTIONS = [
  { value: "brief", label: "Quick", time: "5-10 mins" },
  { value: "standard", label: "Normal", time: "15-30 mins" },
  { value: "extended", label: "Long", time: "30-60 mins" },
];

// Tone options
const TONE_OPTIONS = [
  {
    value: "simplified",
    label: "Simple",
    subtext: "Clear and concise",
  },
  {
    value: "academic",
    label: "Academic",
    subtext: "Formal and technical",
  },

  {
    value: "conversational",
    label: "Conversational",
    subtext: "Casual and friendly",
  },
];

// Simple array of keywords to highlight
const KEYWORDS = [
  "slideshow",
  "slidedeck",
  "slide deck",
  "slide",
  "slides",
  "presentation",
  "deck",
  "worksheet",
  "quiz",
  "test",
  "exam",
  "assessment",
  "lesson plan",
  "curriculum",
];

const SelectItem = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string; value: string }
>(({ children, className, ...props }, ref) => {
  return (
    <Select.Item
      className={cn(
        "relative flex items-center px-2 py-2 rounded-sm text-sm text-gray-300",
        "data-[highlighted]:bg-gray-800 data-[highlighted]:text-white outline-none cursor-pointer",
        className
      )}
      {...props}
      ref={ref}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2">
        <Check className="h-4 w-4" />
      </Select.ItemIndicator>
    </Select.Item>
  );
});

SelectItem.displayName = "SelectItem";

// Add these animation variants at the top level
const tabContentVariants = {
  enter: {
    opacity: 0,
    y: 5,
    transition: {
      duration: 0.2,
    },
  },
  center: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
};

export const HighlightedInput = forwardRef<
  HTMLTextAreaElement,
  HighlightedInputProps
>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder = "",
      disabled = false,
      className,
      showInstructions = false,
      onShowInstructionsChange,
      onSettingsChange,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref ||
      innerRef) as React.RefObject<HTMLTextAreaElement>;
    const [highlightedText, setHighlightedText] = useState<React.ReactNode[]>(
      []
    );
    const [lastCursorPos, setLastCursorPos] = useState<number | null>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    // Add activeTab state
    const [activeTab, setActiveTab] = useState<"what" | "who" | "how">("what");

    // Settings state
    const [settings, setSettings] = useState<LessonSettings>({
      contentType: "",
      gradeLevel: "",
      length: "standard",
      tone: "academic",
    });

    // Update settings and notify parent
    const updateSettings = (key: keyof LessonSettings, value: string) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
    };

    // Function to update cursor position visually
    const updateCursorPosition = () => {
      if (lastCursorPos === null || !textRef.current || !cursorRef.current)
        return;

      // Create a temporary span to measure the text width up to the cursor
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.style.font = window.getComputedStyle(textRef.current).font;

      // Insert text up to cursor position
      tempSpan.textContent = value.substring(0, lastCursorPos);
      document.body.appendChild(tempSpan);

      // Adjust cursor position to be exactly between characters
      const width = tempSpan.getBoundingClientRect().width;
      cursorRef.current.style.left = `${width}px`;

      // Clean up
      document.body.removeChild(tempSpan);
    };

    // Function to process and highlight text - simplified
    const processText = (text: string) => {
      if (!text) {
        setHighlightedText([]);
        return;
      }

      // Create a working copy we can manipulate
      let workingText = text;
      const segments: Array<{ text: string; isHighlighted: boolean }> = [];

      // Process each keyword - handling longest keywords first to avoid nested matches
      const sortedKeywords = [...KEYWORDS].sort((a, b) => b.length - a.length);

      // First pass: collect all matches with their positions
      const matches: Array<{ keyword: string; index: number }> = [];

      for (const keyword of sortedKeywords) {
        // Convert spaces to \s+ to match any whitespace variations
        const escapedKeyword = keyword.replace(/\s+/g, "\\s+");
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi");
        let match;

        while ((match = regex.exec(workingText)) !== null) {
          matches.push({
            keyword: match[0],
            index: match.index,
          });
        }
      }

      // Sort matches by index
      matches.sort((a, b) => a.index - b.index);

      // Process matches in order, avoiding overlaps
      let lastIndex = 0;

      for (const match of matches) {
        // Check if this match overlaps with a previous one
        if (match.index < lastIndex) continue;

        // Add the text before the match
        if (match.index > lastIndex) {
          segments.push({
            text: workingText.substring(lastIndex, match.index),
            isHighlighted: false,
          });
        }

        // Add the highlighted match
        segments.push({
          text: match.keyword,
          isHighlighted: true,
        });

        lastIndex = match.index + match.keyword.length;
      }

      // Add any remaining text
      if (lastIndex < workingText.length) {
        segments.push({
          text: workingText.substring(lastIndex),
          isHighlighted: false,
        });
      }

      // Convert segments to React nodes
      const result = segments.map((segment, index) => {
        if (segment.isHighlighted) {
          return (
            <motion.span
              key={`highlight-${index}`}
              initial={{ backgroundColor: "transparent" }}
              animate={{ backgroundColor: "rgba(75, 85, 99, 0.5)" }}
              transition={{ duration: 0.2 }}
              className="rounded px-1 bg-gray-600/50 text-white"
            >
              {segment.text}
            </motion.span>
          );
        }
        return segment.text;
      });

      setHighlightedText(result);
    };

    // Process text when value changes
    useEffect(() => {
      processText(value);
    }, [value]);

    // Update cursor position when text or cursor position changes
    useEffect(() => {
      if (resolvedRef.current === document.activeElement) {
        setTimeout(updateCursorPosition, 0);
      }
    }, [value, lastCursorPos]);

    // Set up focus/blur event listeners
    useEffect(() => {
      const handleFocus = () => {
        setTimeout(updateCursorPosition, 0);
      };

      const textareaElement = resolvedRef.current;
      if (textareaElement) {
        textareaElement.addEventListener("focus", handleFocus);

        return () => {
          textareaElement.removeEventListener("focus", handleFocus);
        };
      }
    }, []);

    // Restore cursor position after text changes
    useEffect(() => {
      if (lastCursorPos !== null && resolvedRef.current) {
        resolvedRef.current.focus();
        resolvedRef.current.setSelectionRange(lastCursorPos, lastCursorPos);
      }
    }, [lastCursorPos]);

    // Handle input changes and save cursor position
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const cursorPos = e.target.selectionStart;
      onChange(e.target.value);
      setLastCursorPos(cursorPos);
    };

    return (
      <div className="relative w-full">
        <div className="relative w-full h-24">
          {/* Hidden textarea for actual input */}
          <textarea
            ref={resolvedRef}
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "absolute inset-0 w-full h-full opacity-0 resize-none",
              className
            )}
            style={{ caretColor: "transparent" }}
          />

          {/* Display layer with highlighted text */}
          <div
            className={cn(
              "absolute inset-0 w-full h-full overflow-auto whitespace-pre-wrap p-3",
              "text-white placeholder-gray-400 focus:outline-none",
              className,
              !highlightedText.length &&
                value === "" &&
                "before:content-[attr(data-placeholder)] before:text-gray-400"
            )}
            data-placeholder={placeholder}
            onClick={() => resolvedRef.current?.focus()}
          >
            {highlightedText.length > 0 ? (
              <span ref={textRef} className="relative">
                {highlightedText}
                <span
                  ref={cursorRef}
                  className="absolute top-0 animate-pulse"
                  style={{
                    height: "1.2em",
                    opacity:
                      resolvedRef.current === document.activeElement ? 1 : 0,
                    pointerEvents: "none",
                    width: "2px",
                    backgroundColor: "white",
                  }}
                />
              </span>
            ) : (
              value
            )}
          </div>
          {/* Settings Summary Pills */}
          <div className="absolute left-4 bottom-2 flex items-center space-x-2">
            {settings.length && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  settings.length === "standard"
                    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/20"
                }`}
              >
                {LENGTH_OPTIONS.find(
                  (l) => l.value === settings.length
                )?.label.split(" ")[0] || "Length"}
              </motion.span>
            )}
            {settings.tone && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20"
              >
                {TONE_OPTIONS.find((t) => t.value === settings.tone)?.label ||
                  "Tone"}
              </motion.span>
            )}
            {settings.contentType && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="px-2 py-1 flex items-center gap-2 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20"
              >
                {CONTENT_TYPES.find((c) => c.value === settings.contentType)
                  ?.shortLabel || "Type"}
              </motion.span>
            )}
            {settings.gradeLevel && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20"
              >
                {GRADE_LEVELS.find((g) => g.value === settings.gradeLevel)
                  ?.shortLabel || "Grade"}
              </motion.span>
            )}
          </div>
        </div>

        {/* Restore the collapsible instruction panel */}
        <AnimatePresence mode="wait">
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.29, ease: "easeOut" }}
              className="w-full overflow-hidden"
            >
              <div className="w-full bg-gray-950/90 rounded-b-lg border border-gray-800 p-4 min-h-[400px] flex flex-col">
                <div className="flex-1">
                  {/* Enhanced Tabs Navigation */}
                  <div className="relative justify-between flex space-x-1 mb-6">
                    <div className="flex space-x-1 z-10 bg-gray-900 rounded-lg ">
                      {[
                        {
                          id: "what",
                          label: "What",
                          icon: (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          ),
                        },
                        {
                          id: "who",
                          label: "Who",
                          icon: (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            </svg>
                          ),
                        },
                        {
                          id: "how",
                          label: "How",
                          icon: (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          ),
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() =>
                            setActiveTab(tab.id as "what" | "who" | "how")
                          }
                          className={cn(
                            "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-gray-800/20 ",
                            activeTab === tab.id
                              ? "text-white"
                              : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            {tab.icon}
                            <span>{tab.label}</span>
                          </div>
                          {activeTab === tab.id && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-gray-800 rounded-lg -z-10"
                              transition={{
                                type: "spring",
                                duration: 0.5,
                                bounce: 0.2,
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    <motion.div className="text-sm flex items-center  text-gray-500 text-right">
                      {activeTab === "what" && "What do you want to create?"}
                      {activeTab === "who" && "Who do you want to create for?"}
                      {activeTab === "how" &&
                        "How long and what tone do you want to create in?"}
                    </motion.div>
                  </div>

                  {/* Enhanced Tab Content with Animations */}
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {activeTab === "what" && (
                        <motion.div
                          key="what"
                          variants={tabContentVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="space-y-4"
                        >
                          <div className="relative">
                            <div className="flex flex-col space-y-3 mt-8">
                              <label className="text-sm font-medium text-gray-400">
                                Content Type
                              </label>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {CONTENT_TYPES.map((type) => (
                                  <motion.button
                                    key={type.value}
                                    onClick={() =>
                                      updateSettings("contentType", type.value)
                                    }
                                    className={cn(
                                      "relative flex items-center p-3 rounded-lg border transition-all duration-200",
                                      "hover:shadow-lg hover:-translate-y-0.5",
                                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950",
                                      settings.contentType === type.value
                                        ? "border-blue-500 bg-blue-500/10 text-white focus:ring-blue-500"
                                        : "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 focus:ring-gray-500"
                                    )}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-sm flex items-center gap-2">
                                      {type.icon}
                                      {type.label}
                                    </span>
                                    {settings.contentType === type.value && (
                                      <motion.div
                                        layoutId="selectedContent"
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                      >
                                        <Check className="w-4 h-4 text-blue-400" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "who" && (
                        <motion.div
                          key="who"
                          variants={tabContentVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="space-y-4"
                        >
                          <div className="relative">
                            <div className="flex flex-col space-y-3 mt-8">
                              <label className="text-sm font-medium text-gray-400">
                                Grade Level
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                {GRADE_LEVELS.map((grade) => (
                                  <motion.button
                                    key={grade.value}
                                    onClick={() =>
                                      updateSettings("gradeLevel", grade.value)
                                    }
                                    className={cn(
                                      "relative flex items-center p-3 rounded-lg border transition-all duration-200",
                                      "hover:shadow-lg hover:-translate-y-0.5",
                                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950",
                                      settings.gradeLevel === grade.value
                                        ? "border-purple-500 bg-purple-500/10 text-white focus:ring-purple-500"
                                        : "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 focus:ring-gray-500"
                                    )}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-sm">
                                      {grade.label}
                                    </span>
                                    {settings.gradeLevel === grade.value && (
                                      <motion.div
                                        layoutId="selectedGrade"
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                      >
                                        <Check className="w-4 h-4 text-purple-400" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "how" && (
                        <motion.div
                          key="how"
                          variants={tabContentVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="space-y-4"
                        >
                          <div className="relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                              <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-400">
                                  Length
                                </label>
                                <div className="flex flex-col mt-1 space-y-2">
                                  {LENGTH_OPTIONS.map((option) => (
                                    <motion.button
                                      key={option.value}
                                      onClick={() =>
                                        updateSettings("length", option.value)
                                      }
                                      className={cn(
                                        "relative flex items-center justify-between p-2 rounded-lg border transition-all duration-200",
                                        "hover:shadow-lg hover:-translate-y-0.5",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950",
                                        settings.length === option.value
                                          ? "border-green-500 bg-green-500/10 text-white focus:ring-green-500"
                                          : "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 focus:ring-gray-500"
                                      )}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <span className="text-sm flex items-center gap-2">
                                        {option.label}
                                        {option.time && (
                                          <span className="text-xs bg-gray-900  font-normal py-1 px-2 rounded-full">
                                            ({option.time})
                                          </span>
                                        )}
                                      </span>
                                      {settings.length === option.value && (
                                        <motion.div
                                          layoutId="selectedLength"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                        >
                                          <Check className="w-4 h-4 text-green-400" />
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-400">
                                  Tone
                                </label>
                                <div className="flex flex-col mt-1 space-y-2">
                                  {TONE_OPTIONS.map((option) => (
                                    <motion.button
                                      key={option.value}
                                      onClick={() =>
                                        updateSettings("tone", option.value)
                                      }
                                      className={cn(
                                        "relative flex items-center justify-between p-2 rounded-lg border transition-all duration-200",
                                        "hover:shadow-lg hover:-translate-y-0.5",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950",
                                        settings.tone === option.value
                                          ? "border-amber-500 bg-amber-500/10 text-white focus:ring-amber-500"
                                          : "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 focus:ring-gray-500"
                                      )}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <span className="text-sm flex items-center gap-2">
                                        {option.label}
                                        {option.subtext && (
                                          <span className="text-xs bg-gray-900  font-normal py-1 px-2 rounded-full">
                                            {option.subtext}
                                          </span>
                                        )}
                                      </span>
                                      {settings.tone === option.value && (
                                        <motion.div
                                          layoutId="selectedTone"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                        >
                                          <Check className="w-4 h-4 text-amber-400" />
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex justify-end mt-auto pt-4">
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg transition-all duration-200",
                      "text-xs font-medium",
                      "bg-gray-800 text-gray-300 hover:bg-gray-700",
                      "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                    )}
                    onClick={() => {
                      setSettings({
                        contentType: "",
                        gradeLevel: "",
                        length: "standard",
                        tone: "academic",
                      });
                    }}
                  >
                    Clear
                  </button>
                  <motion.button
                    className={cn(
                      "ml-2 px-4 py-2 rounded-lg transition-all duration-200",
                      "text-xs font-medium",
                      "bg-blue-700 text-white hover:bg-blue-600",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                    )}
                    onClick={() => {
                      onSettingsChange?.(settings);
                      onShowInstructionsChange?.(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

HighlightedInput.displayName = "HighlightedInput";
