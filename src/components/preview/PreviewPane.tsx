import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  Download,
  Maximize2,
  ExternalLink,
  Minimize2,
  Check,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { PreviewSettings } from "./PreviewSettings";
import { LessonSettings } from "@/types";
import MarkdownWorksheet from "./MarkdownWorksheet";
import { ReactTyped } from "react-typed";

// Animation variants
const previewVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 50, transition: { duration: 0.2, ease: "easeIn" } },
};

type PreviewPaneProps = {
  isOpen: boolean;
  onClose: () => void;
  presentationContent?: string;
  validationData?: { status: string | null; errors: any[] };
  contentMetadata?: any;
  currentStep: number;
  progressSteps: string[];
  statusMessages: string[];
  isPreviewFullscreen: boolean;
  toggleFullscreen: () => void;
};

const PreviewPane: React.FC<PreviewPaneProps> = ({
  isOpen,
  onClose,
  presentationContent,
  validationData,
  contentMetadata = {},
  currentStep,
  progressSteps,
  statusMessages,
  isPreviewFullscreen,
  toggleFullscreen,
}) => {
  // If the preview is not open, return null
  if (!isOpen) {
    return null;
  }

  // Add a state to track if the pane is being closed
  const [isClosing, setIsClosing] = useState(false);

  // Add state to track hover on close button
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  // Add state for view mode (worksheet or markdown)
  const [viewMode, setViewMode] = useState<"markdown" | "worksheet">(
    "worksheet"
  );

  // State for status updates collapse
  const [isStatusCollapsed, setIsStatusCollapsed] = useState(false);

  // State for context panel collapse
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);

  // Extract content metadata
  const title = contentMetadata?.title || "Worksheet";
  const gradeLevel = contentMetadata?.gradeLevel || "8";
  const retrievedContext = contentMetadata?.retrievedContext || null;

  // Safely parse the content
  const [safeContent, setSafeContent] = useState<string>("");

  // Use effect to safely handle content updates
  useEffect(() => {
    if (presentationContent) {
      try {
        // Clean up any potential incomplete content
        let cleanedContent = presentationContent;
        setSafeContent(cleanedContent);
      } catch (error) {
        console.error("Error processing content:", error);
        setSafeContent("Error processing content. Please try again.");
      }
    } else {
      setSafeContent("Generating content...");
    }
  }, [presentationContent]);

  // Extract lesson settings from contentMetadata for the PreviewSettings component
  const lessonSettings: LessonSettings = {
    contentType: contentMetadata?.contentType || "worksheet",
    gradeLevel: contentMetadata?.gradeLevel || "8",
    length: contentMetadata?.length || "standard",
    tone: contentMetadata?.tone || "academic",
  };

  // Replace the current onClose handler with a new one that shows dismissal message
  const handleClose = () => {
    setIsClosing(true);
    // After showing the message, actually close the pane
    setTimeout(() => onClose(), 800);
  };

  return (
    <motion.div
      variants={previewVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "fixed top-0 bottom-0 right-0 z-50 bg-gray-950 border-l border-gray-800 flex flex-col",
        isPreviewFullscreen ? "w-full left-0" : "w-1/2"
      )}
      style={{ zIndex: 50 }}
    >
      {/* Preview Header - MODIFIED */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        {/* Left side: Title, Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            {isPreviewFullscreen && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-medium text-white">Preview</h2>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center ">
            <button
              onClick={() => setViewMode("markdown")}
              className={cn(
                "px-2 py-1 text-xs rounded-l-md transition-colors",
                viewMode === "markdown"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Markdown
            </button>
            <button
              onClick={() => setViewMode("worksheet")}
              className={cn(
                "px-2 py-1 text-xs rounded-r-md transition-colors",
                viewMode === "worksheet"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Worksheet
            </button>
          </div>

          {/* Lesson Settings Display - MOVED HERE */}
          <PreviewSettings settings={lessonSettings} layout="horizontal" />
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center space-x-1">
          {/* Download Button */}
          <button
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Download as Markdown"
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([safeContent], { type: "text/markdown" });
              element.href = URL.createObjectURL(file);
              element.download = `${title.replace(/\s+/g, "_")}.md`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title={isPreviewFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isPreviewFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleClose}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors relative"
            title="Close preview"
          >
            <X className="w-4 h-4" />

            {/* Tooltip that appears when hovering over close button */}
            {isCloseHovered && (
              <div className="absolute -bottom-12 right-0 bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap">
                Close preview (can be reopened)
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Step {currentStep + 1} of {progressSteps.length}
            </span>
            {/* Display Validation Status/Errors */}
            {validationData &&
              validationData.status &&
              validationData.status !== "skipped" && (
                <div
                  className={cn(
                    "px-3 py-1 border-b rounded-lg border-gray-800 text-xs",
                    validationData.status === "valid" &&
                      "bg-green-900/30 text-green-300",
                    validationData.status === "errors_found" &&
                      "bg-red-900/30 text-red-300",
                    validationData.status === "validation_error" &&
                      "bg-yellow-900/30 text-yellow-300"
                  )}
                >
                  <div className="flex items-center gap-2 font-medium ">
                    {validationData.status === "valid" && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {validationData.status === "errors_found" && (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {validationData.status === "validation_error" && (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Accuracy:{" "}
                      {validationData.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  {validationData.status === "errors_found" &&
                    validationData.errors &&
                    validationData.errors.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1  text-red-400">
                        {validationData.errors.map((err, idx) => (
                          <li key={idx}>
                            {err.error_detail}
                            {err.correction &&
                              ` (Correction: ${err.correction})`}
                          </li>
                        ))}
                      </ul>
                    )}
                  {validationData.status === "validation_error" && (
                    <p>Could not validate content due to an internal error.</p>
                  )}
                </div>
              )}
          </div>
          <span className="text-xs text-gray-400">
            {Math.round(((currentStep + 1) / progressSteps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStep + 1) / progressSteps.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1 mb-2">
          {progressSteps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center relative"
              style={{ width: `${100 / progressSteps.length}%` }}
            >
              <span
                className={cn(
                  "text-xs whitespace-nowrap absolute -bottom-5",
                  index <= currentStep ? "text-blue-400" : "text-gray-500"
                )}
                style={{
                  transform: "translateX(-50%)",
                  left: "50%",
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Retrieved Context Panel - NEW */}
      {retrievedContext && (
        <div className="border-b border-gray-800 bg-gray-900/30">
          <div
            className="flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-gray-800/30"
            onClick={() => setIsContextCollapsed(!isContextCollapsed)}
          >
            <h3 className="text-xs font-medium text-gray-300 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-2 text-blue-400" />
              Retrieved Mathematical Context
            </h3>
            <button className="p-1 rounded-md text-gray-400 hover:text-white transition-colors">
              {isContextCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isContextCollapsed && (
            <div className="px-4 py-3 text-xs text-gray-300 max-h-60 overflow-y-auto bg-gray-800/20 prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{retrievedContext}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Preview Content - Updated to use MarkdownWorksheet */}
      <div
        className={cn(
          "flex-1 overflow-auto",
          viewMode === "markdown"
            ? "p-8 prose prose-invert prose-sm max-w-none bg-gray-900"
            : "p-8 bg-gray-700"
        )}
      >
        {/* Skeleton UI for content being generated */}
        {!safeContent || safeContent === "Generating content..." ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 m-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-800 rounded-lg w-3/4 mb-6"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-full"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-5/6"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-4/6"></div>
              <div className="h-24 bg-gray-800 rounded-lg w-full mt-6"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-full mt-6"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-5/6"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-4/6"></div>
            </div>
            <div className="text-center mt-4 text-gray-500">
              {statusMessages && statusMessages.length > 0 ? (
                <p>{statusMessages[statusMessages.length - 1]}</p>
              ) : (
                <ReactTyped
                  className="text-gray-500"
                  strings={["Generating content...", "Generating content..."]}
                  typeSpeed={100}
                  backSpeed={50}
                  loop
                />
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Show either worksheet or raw markdown view based on viewMode */}
            {viewMode === "worksheet" ? (
              <MarkdownWorksheet
                content={safeContent}
                title={`${title}${gradeLevel ? ` (Grade ${gradeLevel})` : ""}`}
              />
            ) : (
              <ReactMarkdown>{safeContent}</ReactMarkdown>
            )}
          </>
        )}
      </div>

      {/* Status Updates */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-medium text-gray-400 ">Status Updates</h3>
          <button
            onClick={() => setIsStatusCollapsed(!isStatusCollapsed)}
            className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title={isStatusCollapsed ? "Expand status" : "Collapse status"}
          >
            {isStatusCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {!isStatusCollapsed && (
            <motion.div
              key="status-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="text-xs text-gray-500 space-y-1 max-h-24 overflow-y-auto"
            >
              {statusMessages && statusMessages.length > 0 ? (
                statusMessages.map((message, index) => (
                  <p key={index} className="animate-fadeIn">
                    {message}
                  </p>
                ))
              ) : (
                <p>No status updates available</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Download/Open buttons */}
      {/* <div className="border-t border-gray-800 bg-gray-900 p-3 flex justify-between">
        <button className="px-3 py-1.5 text-xs rounded-md bg-gray-800 text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        <button className="px-4 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
          Open Full
        </button>
      </div> */}

      {/* Add a dismissal message that appears when closing */}
      {isClosing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm"
        >
          <div className="text-center p-6 rounded-lg">
            <X className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              Closing Preview
            </h3>
            <p className="text-gray-400 mb-2">
              You can reopen it anytime using the "Show Preview" button
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PreviewPane;
