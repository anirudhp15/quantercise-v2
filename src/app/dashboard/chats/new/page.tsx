"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Upload,
  Layout,
  FileText,
  BookOpen,
  Calculator,
  User,
  Copy,
  CheckCheck,
  ZoomIn,
  Presentation,
  Ruler,
  CalendarCheck,
  ListChecks,
  ClipboardList,
  Pencil,
  X,
  AlertCircle,
  RefreshCw,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { useClerkSupabase } from "@/lib/hooks/use-clerk-supabase";
import { toast } from "@/components/ui/use-toast";
import PreviewPane from "@/components/preview/PreviewPane";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { SiOpenai } from "react-icons/si";
import { HighlightedInput } from "@/components/ui/highlighted-input";
import MathRenderer from "@/components/MathRenderer";
import { LessonSettings } from "@/types";
import { useDashboard } from "@/contexts/DashboardContext";
import { Message, MessageAttachment } from "@/types/chat";

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const examplePrompts = {
  student: [
    {
      icon: <Calculator className="w-5 h-5" />,
      label: "Practice Quadratics",
      description: "10 quadratic equations with solutions",
      prompt:
        "Generate a worksheet of 10 quadratic equation problems (solve by factoring, completing the square, and quadratic formula) with step-by-step solutions.",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: "Intro to Derivatives",
      description: "Explain derivatives simply",
      prompt:
        "Explain the basic concept of derivatives for 8th graders, with 5 visual examples and simple definitions.",
    },
    {
      icon: <Layout className="w-5 h-5" />,
      label: "Circle Geometry",
      description: "5 circle area & circumference problems",
      prompt:
        "Create 8 practice problems about circle circumference and area, plus worked solutions.",
    },
    {
      icon: <Ruler className="w-5 h-5" />,
      label: "Angle Relationships",
      description: "Exercises on angle types",
      prompt:
        "Make a set of 7 exercises on complementary, supplementary, and vertical angles, with answers.",
    },
    {
      icon: <Pencil className="w-5 h-5" />,
      label: "Triangle Congruence",
      description: "Triangle SSS, SAS, ASA practice",
      prompt:
        "Write 6 practice problems on triangle congruence criteria (SSS, SAS, ASA) and show full solutions.",
    },
    {
      icon: <Pencil className="w-5 h-5" />,
      label: "Fraction Word Problems",
      description: "Real-world fraction problems",
      prompt:
        "Generate 5 real-world word problems involving adding and subtracting fractions, with detailed solutions.",
    },
  ],
  teacher: [
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Detailed Lesson Plan",
      description: "45-min linear functions plan",
      prompt:
        "Create a 45-minute lesson plan for teaching linear functions to 7th graders, including objectives, warm-up, guided practice, and exit ticket.",
    },
    {
      icon: <Layout className="w-5 h-5" />,
      label: "Slide Deck Design",
      description: "10 slides on Pythagorean theorem",
      prompt:
        "Design a 10-slide deck on the Pythagorean theorem, with visuals and speaker notes for a 20-minute class.",
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      label: "Worksheet Generator",
      description: "8 systems of equations problems",
      prompt:
        "Generate a worksheet with 8 practice problems on solving systems of equations by substitution, plus answer key.",
    },
    {
      icon: <ListChecks className="w-5 h-5" />,
      label: "Quiz Creation",
      description: "10-question slope quiz",
      prompt:
        "Create a 10-question multiple-choice quiz on slope and y-intercept with an answer sheet.",
    },
    {
      icon: <CalendarCheck className="w-5 h-5" />,
      label: "Homework Assignment",
      description: "Graphing inequalities homework",
      prompt:
        "Draft a homework assignment for topic 'graphing inequalities' with 12 questions and full solutions.",
    },
    {
      icon: <Presentation className="w-5 h-5" />,
      label: "Interactive Activity",
      description: "Probability dice & coin game",
      prompt:
        "Outline an interactive class activity for teaching basic probability using dice and coins, with instructions and discussion prompts.",
    },
  ],
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-gray-400 hover:text-white"
      title="Copy message"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-green-400"
          >
            <CheckCheck className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Copy className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

interface DropZoneProps {
  onFileSelect: (files: File[]) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  multiple?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  isActive,
  setIsActive,
  multiple = false,
  maxSize = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File "${file.name}" is not a supported image type`);
        continue;
      }

      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`File "${file.name}" exceeds ${maxSize}MB size limit`);
        continue;
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors.join(". "));
      setTimeout(() => setError(null), 5000);
    }

    if (valid.length > 0) {
      onFileSelect(multiple ? valid : [valid[0]]);
    }

    setIsActive(false);
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setIsActive(false);
      }
    };

    if (isActive) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isActive, setIsActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={dropRef}
        className={`max-w-md w-full mx-4 bg-gray-900 border-2 rounded-xl p-6 ${
          dragOver ? "border-blue-500 bg-blue-900/20" : "border-gray-700"
        } transition-all duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center">
          <div
            className={`p-4 rounded-full mb-3 ${
              dragOver ? "bg-blue-500/20" : "bg-gray-800"
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {dragOver ? "Drop files here" : "Upload Images"}
          </h3>
          <p className="text-sm text-gray-400 text-center mb-4">
            Drag and drop or click to select.
            {multiple ? " You can upload multiple files." : ""}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Accepted formats: JPG, PNG, GIF, WebP (max {maxSize}MB)
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center p-2 mt-2 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-xs"
              >
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsActive(false);
            }}
          >
            Cancel
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={allowedTypes.join(",")}
          multiple={multiple}
        />
      </div>
    </div>
  );
};

const ImageViewer = ({
  src,
  alt,
  isOpen,
  onClose,
}: {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] overflow-auto p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-900/80 text-white z-10 hover:bg-gray-800"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="relative aspect-auto min-h-[300px] flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}

            {error ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-gray-300 mb-3">Failed to load image</p>
                <button
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(false);
                    setIsLoading(true);
                  }}
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : (
              <img
                src={src}
                alt={alt}
                className={`max-w-full max-h-[80vh] object-contain transition-opacity duration-300 ${
                  isLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setError(true);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({
  role,
  content,
  messageId,
  hasPreview = false,
  previewId,
  onShowPreview,
}: {
  role: string;
  content: string;
  messageId?: string;
  threadId?: string;
  hasPreview?: boolean;
  previewId?: string;
  onShowPreview?: (previewId?: string) => void;
}) => {
  const { user } = useClerkSupabase();
  const [isHovered, setIsHovered] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const isUUID = (id: string | undefined): boolean => {
      if (!id) return false;
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidPattern.test(id);
    };

    async function fetchAttachments() {
      if (!messageId || !isUUID(messageId)) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("attachments")
          .select("*")
          .eq("message_id", messageId);

        if (error) {
          console.error("Error fetching attachments:", error);
          return;
        }

        setAttachments(data || []);
      } catch (error) {
        console.error("Error in fetchAttachments:", error);
      }
    }

    fetchAttachments();
  }, [messageId, supabase]);

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const renderContent = (text: string) => {
    const imageRegex = /\[Image: (.*?)\]|\[Image attached: (.*?)\]/g;
    const hasImage = imageRegex.test(text);

    imageRegex.lastIndex = 0;

    const processedText = hasImage ? text.replace(imageRegex, "") : text;

    let imageName = null;
    if (hasImage) {
      const match = imageRegex.exec(text);
      if (match && (match[1] || match[2])) {
        imageName = match[1] || match[2];
      }
    }

    const parts = processedText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/);

    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            return (
              <MathRenderer
                key={index}
                expression={part.slice(2, -2)}
                displayMode={true}
                errorColor="#ff5555"
              />
            );
          } else if (part.startsWith("$") && part.endsWith("$")) {
            return (
              <MathRenderer
                key={index}
                expression={part.slice(1, -1)}
                displayMode={false}
                errorColor="#ff5555"
              />
            );
          }
          return <span key={index}>{part}</span>;
        })}

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative rounded-lg overflow-hidden border border-gray-700 max-w-sm group"
              >
                <div className="bg-gray-800 p-3 text-sm text-gray-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="truncate max-w-[180px]">
                      {attachment.file_name}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedImage(getImageUrl(attachment.file_path))
                    }
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                    title="View full image"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className="relative w-full h-48 bg-gray-900/50 cursor-pointer overflow-hidden"
                  onClick={() =>
                    setSelectedImage(getImageUrl(attachment.file_path))
                  }
                >
                  <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                    <div className="p-2 bg-black/60 rounded-full">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="relative w-full h-full">
                    <img
                      src={getImageUrl(attachment.file_path)}
                      alt={attachment.file_name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasImage && attachments.length === 0 && (
          <div className="mt-3">
            <div className="relative rounded-lg overflow-hidden border border-gray-700 max-w-sm">
              <div className="bg-gray-800 p-3 text-sm text-gray-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {imageName}
              </div>
              <div className="p-4 bg-gray-900/50">
                <div className="aspect-video flex items-center justify-center bg-gray-800/50 rounded">
                  <div className="text-center p-4">
                    <p className="text-sm text-gray-400">
                      Image attachment mentioned but not found in database.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <ImageViewer
          src={selectedImage || ""}
          alt="Full size image"
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  };

  const handlePreviewClick = () => {
    if (onShowPreview) {
      onShowPreview(previewId);
    }
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "px-4 w-full max-w-3xl mx-auto py-4 flex mt-4 rounded-lg group relative",
        role === "assistant"
          ? " text-white"
          : "bg-gray-900/50 border-2 border-gray-800/50 text-white"
      )}
    >
      <div className="mx-auto w-full flex gap-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
          {role === "assistant" ? (
            <div className="bg-gray-100 w-full h-full flex items-center justify-center text-black font-bold">
              <SiOpenai className="w-4 h-4" />
            </div>
          ) : (
            <div className="bg-[#8e79f3] w-full h-full flex items-center justify-center text-white font-bold">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="flex-1 prose prose-invert max-w-none">
          {role === "assistant" && (
            <div className="flex justify-start gap-2 items-center mb-1">
              <div className="text-sm text-gray-400">Assistant</div>
            </div>
          )}
          {role === "user" && (
            <div className="text-sm text-gray-400">
              {user?.firstName ? user.firstName : "User"}
            </div>
          )}
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {renderContent(content)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-2 right-2 flex items-center gap-1"
          >
            {hasPreview && onShowPreview && (
              <button
                onClick={handlePreviewClick}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-gray-400 hover:text-white"
                title="Show preview"
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
            <CopyButton text={content} />
          </motion.div>
        )}
      </AnimatePresence>

      {hasPreview && !isHovered && (
        <div className="absolute top-4 right-4 flex items-center">
          <div className="p-1 rounded-full bg-blue-600/20 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <span className="ml-1 text-xs text-blue-400">Preview available</span>
        </div>
      )}
    </motion.div>
  );
};

const extractTitle = (markdownContent: string): string => {
  try {
    const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    return "Worksheet";
  } catch (error) {
    console.error("Error extracting title:", error);
    return "Worksheet";
  }
};

const ChatPage = () => {
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("id");
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useClerkSupabase();
  useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [previewData, setPreviewData] = useState<{
    presentationContent: string | null;
    metadata: any;
    validation: { status: string | null; errors: any[] };
  }>({
    presentationContent: null,
    metadata: {},
    validation: { status: null, errors: [] },
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState<string>("");
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<
    { file: string; error: string }[]
  >([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [progress, setProgress] = useState<{
    steps: string[];
    currentStep: number;
    messages: string[];
  }>({
    steps: ["Chat", "Retrieval", "Preview", "Validation", "Finalizing"],
    currentStep: -1,
    messages: [],
  });

  const [lessonSettings, setLessonSettings] = useState<LessonSettings>({
    contentType: "worksheet",
    gradeLevel: "8",
    length: "standard",
    tone: "academic",
  });

  const threadIdRef = useRef<string | null>(initialThreadId);
  useDashboard();

  const [useV1Fallback, setUseV1Fallback] = useState(false);

  useEffect(() => {
    async function loadConversation() {
      const currentThreadId = threadIdRef.current;
      if (currentThreadId) {
        setIsLoading(true);
        setMessages([]);
        setPreviewData({
          presentationContent: null,
          metadata: {},
          validation: { status: null, errors: [] },
        });
        setProgress((prev) => ({ ...prev, currentStep: -1, messages: [] }));

        console.log(`Loading thread: ${currentThreadId}`);
        try {
          const { data: threadData, error: threadError } = await supabase
            .from("threads")
            .select(`*, messages (*)`)
            .eq("id", currentThreadId)
            .order("created_at", {
              referencedTable: "messages",
              ascending: true,
            })
            .single();

          if (threadError) {
            if (threadError.code === "PGRST116") {
              console.warn(
                `Thread not found: ${currentThreadId}. Starting fresh.`
              );
              threadIdRef.current = null;
              // !!! COMMENT OUT or REMOVE below line !!!
              // router.replace("/dashboard/chats/new", { scroll: false });
            } else {
              throw threadError;
            }
          } else if (threadData) {
            console.log("Loaded thread data:", threadData);
            setMessages((threadData.messages as Message[]) || []);

            const initialMetadata = threadData.preview_metadata || {};
            setPreviewData({
              presentationContent: threadData.preview_content || null,
              metadata: initialMetadata,
              validation: {
                status: initialMetadata?.validationStatus || null,
                errors: initialMetadata?.validationErrors || [],
              },
            });
            if (threadData.preview_content) {
              setIsPreviewOpen(true);
            }
            if (initialMetadata?.contentType) {
              setLessonSettings({
                contentType: initialMetadata.contentType,
                gradeLevel: initialMetadata.gradeLevel || "8",
                length: initialMetadata.length || "standard",
                tone: initialMetadata.tone || "academic",
              });
            }
          } else {
            console.log("No thread data found for ID:", currentThreadId);
            threadIdRef.current = null;
            // !!! COMMENT OUT or REMOVE below line !!!
            // router.replace("/dashboard/chats/new", { scroll: false });
          }
        } catch (error) {
          console.error("Error loading thread:", error);
          toast({
            title: "Error Loading Chat",
            description: "Could not load chat history.",
            variant: "destructive",
          });
          threadIdRef.current = null;
          // !!! COMMENT OUT or REMOVE below line !!!
          // router.replace("/dashboard/chats/new", { scroll: false });
        } finally {
          setIsLoading(false);
        }
      } else {
        setMessages([]);
        setPreviewData({
          presentationContent: null,
          metadata: {},
          validation: { status: null, errors: [] },
        });
        setProgress((prev) => ({ ...prev, currentStep: -1, messages: [] }));
        setIsPreviewOpen(false);
      }
    }
    loadConversation();
  }, [initialThreadId, router, supabase, toast]);

  useEffect(() => {
    console.log("Messages state updated:", messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user?.firstName) setUserName(user.firstName);
  }, [user]);

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    setSelectedImages((prev) => [...prev, ...files]);
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() && selectedImages.length === 0) return;

    setIsLoading(true);
    const startTime = Date.now();
    let lastActivityTime = Date.now();
    const currentInput = input.trim();
    const currentThreadId = threadIdRef.current;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 180000); // 3 minute timeout

    const tempUserId = `user-${crypto.randomUUID()}`;
    const userMessage: Message = {
      id: tempUserId,
      thread_id: currentThreadId || "new",
      role: "user",
      content: currentInput,
      created_at: new Date().toISOString(),
      attachments: [],
    };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setSelectedImages([]);
    setImagePreviews([]);
    inputRef.current?.focus();

    let imageDataPayload: { name: string; type: string; data: string }[] = [];
    if (selectedImages.length > 0) {
      try {
        imageDataPayload = await Promise.all(
          selectedImages.map(async (file) => {
            const base64Data = await fileToBase64(file);
            return {
              name: file.name,
              type: file.type,
              data: base64Data,
            };
          })
        );
      } catch (error) {
        console.error("Error converting images to base64:", error);
        toast({
          title: "Image Processing Error",
          description: "Could not process uploaded images.",
          variant: "destructive",
        });
        setIsLoading(false);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserId));
        return;
      }
    }

    try {
      // Ensure we are calling the V2 endpoint that connects to Python LangServe
      const response = await fetch("/api/chat/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any auth headers if needed
        },
        body: JSON.stringify({
          message: currentInput,
          threadId: currentThreadId,
          settings: lessonSettings,
          images: imageDataPayload,
          mode: searchParams.get("mode") || "student",
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);

        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please sign in to continue.",
            variant: "destructive",
          });
          setMessages((prev) => prev.filter((msg) => msg.id !== tempUserId));
          return;
        }

        // Handle database connection errors specially - try to continue
        if (
          response.status === 500 &&
          (errorData.details?.includes("fetch failed") ||
            errorData.error?.includes("database") ||
            errorData.details?.includes("Supabase"))
        ) {
          console.log(
            "Database connection error detected, continuing in temporary mode"
          );
          toast({
            title: "Database Connection Issue",
            description:
              "Continuing in temporary mode - your chat will work but won't be saved to history.",
            variant: "default",
          });

          // Try to continue the conversation despite the error
          const tempThreadId = `temp-${uuidv4()}`;
          threadIdRef.current = tempThreadId;

          // Update user message with temp thread ID
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempUserId ? { ...msg, thread_id: tempThreadId } : msg
            )
          );

          // Create a mock assistant message
          const assistantMsgId = `assistant-${crypto.randomUUID()}`;
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              thread_id: tempThreadId,
              role: "assistant",
              content:
                "I'm ready to help you, though we're currently in temporary mode due to a database connection issue. Your conversation won't be saved to history, but I can still assist you.",
              created_at: new Date().toISOString(),
              attachments: [],
            },
          ]);

          setIsLoading(false);
          return;
        }

        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("Response body is missing");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let retrievedContext: string | null = null;
      let assistantMsgIdToUpdate: string | null = null;
      let accumulatedChatContent = "";
      let contextPanelCreated = false;

      const TIMEOUT_DURATION = 180000; // 3 minutes
      const PROGRESS_TIMEOUT = 45000; // 45 seconds without progress

      while (true) {
        const currentTime = Date.now();

        // Check for complete timeout
        if (currentTime - startTime > TIMEOUT_DURATION) {
          throw new Error(
            "Request timeout - total processing time exceeded 3 minutes"
          );
        }

        // Check for progress timeout
        if (currentTime - lastActivityTime > PROGRESS_TIMEOUT) {
          throw new Error("Stream timeout - no progress for 45 seconds");
        }

        lastActivityTime = currentTime;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            // Skip raw SSE events like 'event: metadata', ping messages, but allow chat data through
            if (
              (line.startsWith("event:") &&
                !line.includes("event: chat") &&
                !line.includes("event: threadId") &&
                !line.includes("event: preview_update")) ||
              line.includes(": ping -")
            ) {
              console.log(
                "Filtering out SSE event line:",
                line.substring(0, 30) + "..."
              );
              continue;
            }

            // Process data lines that follow event directives
            if (line.startsWith("data:")) {
              try {
                const jsonData = JSON.parse(line.substring(5));

                // Check if this is a chat message with content from ChatResponder
                if (
                  jsonData.ChatResponder &&
                  typeof jsonData.ChatResponder === "string" &&
                  jsonData.ChatResponder.trim() !== ""
                ) {
                  console.log(
                    "Found streaming chat response:",
                    jsonData.ChatResponder.substring(0, 30) + "..."
                  );

                  // This is the actual chat text from ChatResponder, process it as chat content
                  const chatContent = jsonData.ChatResponder;

                  if (!assistantMsgIdToUpdate) {
                    const newAssistantMessageId = `assistant-${crypto.randomUUID()}`;
                    assistantMsgIdToUpdate = newAssistantMessageId;
                    accumulatedChatContent = chatContent;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: newAssistantMessageId,
                        thread_id: threadIdRef.current || "unknown",
                        role: "assistant",
                        content: accumulatedChatContent,
                        created_at: new Date().toISOString(),
                        attachments: [],
                      },
                    ]);
                  } else {
                    accumulatedChatContent += chatContent;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgIdToUpdate
                          ? {
                              ...msg,
                              content: accumulatedChatContent,
                            }
                          : msg
                      )
                    );
                  }
                  continue;
                }

                // Keep type-based messages (like chat, threadId, preview_update) - these will be handled in the normal flow
                if (
                  jsonData.type &&
                  (jsonData.type === "chat" ||
                    jsonData.type === "threadId" ||
                    jsonData.type === "preview_update" ||
                    jsonData.type === "status")
                ) {
                  console.log("Allowing through typed event:", jsonData.type);
                  // Let this continue to be processed normally
                  continue;
                }

                // Filter out context retriever data
                if (jsonData.ContextRetriever) {
                  console.log("Filtering out ContextRetriever data");
                  continue;
                }

                // Filter out internal agent states
                if (
                  jsonData.ChatRouter ||
                  jsonData.IntentAgent ||
                  jsonData.StartParallelProcessing ||
                  jsonData.ContentPlanner ||
                  jsonData.PreviewGenerator ||
                  jsonData.ValidatorAgent ||
                  jsonData.PreviewFormatter
                ) {
                  console.log(
                    "Filtering out internal agent state data:",
                    Object.keys(jsonData)[0]
                  );
                  continue;
                }

                // Only let through proper formatted messages
                if (!jsonData.type) {
                  console.log(
                    "Filtering out data without type field:",
                    Object.keys(jsonData)[0]
                  );
                  continue;
                }
              } catch (e) {
                // Not JSON data, continue processing
              }
            }

            // Process JSON objects (properly formatted messages)
            const isJson = line.startsWith("{") && line.endsWith("}");

            if (isJson) {
              const data = JSON.parse(line);
              console.log("Stream Data Received:", data.type, data);

              // Filter out context data - don't display to user directly
              if (data.type === "data" && data.ContextRetriever) {
                console.log("Skipping context data (not for display)");
                continue;
              }

              // Reset progress timeout on meaningful progress
              if (
                data.type === "preview_stream_chunk" ||
                data.type === "chat" ||
                (data.type === "status" && data.currentStep > 0)
              ) {
                lastActivityTime = currentTime;
              }

              // Handle timeout-related errors specifically
              if (data.type === "error" && data.message?.includes("timeout")) {
                toast({
                  title: "Timeout Error",
                  description:
                    "The content generation timed out. Please try again with a simpler request or shorter content length.",
                  variant: "destructive",
                });
                return;
              }

              switch (data.type) {
                case "threadId":
                  if (!threadIdRef.current) {
                    console.log("Received new thread ID:", data.threadId);
                    threadIdRef.current = data.threadId;
                    const currentIdParam = searchParams.get("id");

                    // Only update URL if this is a permanent thread ID (not temporary)
                    if (!data.temporary && !currentIdParam) {
                      // Use searchParams to get the current mode for the new URL
                      const currentMode = searchParams.get("mode") || "student"; // Get mode or default
                      const newUrl = `/dashboard/chats/new?id=${data.threadId}&mode=${currentMode}`;
                      router.replace(newUrl, { scroll: false });
                      console.log(
                        "Updated URL with new thread ID and correct mode."
                      );
                    } else if (data.temporary) {
                      console.log(
                        "Using temporary thread ID (not updating URL):",
                        data.threadId
                      );
                      // Show a mild notice to the user
                      toast({
                        title: "Working in Temporary Mode",
                        description:
                          "Your chat is working but not being saved to your history due to a database connection issue.",
                        variant: "default",
                      });
                    }

                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === tempUserId
                          ? { ...msg, thread_id: data.threadId }
                          : msg
                      )
                    );
                  }
                  break;
                case "chat":
                  const chatChunk = data.content;

                  // Filter out any raw SSE events or agent data that might be shown to the user
                  let filteredContent = chatChunk;
                  if (typeof filteredContent === "string") {
                    // Remove all raw SSE events
                    if (
                      filteredContent.includes("event:") ||
                      filteredContent.includes("data:") ||
                      filteredContent.includes(": ping -") ||
                      filteredContent.includes("ContextRetriever") ||
                      filteredContent.includes("vector embeddings context") ||
                      filteredContent.includes("ChatRouter") ||
                      filteredContent.includes("IntentAgent") ||
                      filteredContent.includes("ContentPlanner") ||
                      filteredContent.includes("PreviewGenerator") ||
                      filteredContent.includes("ValidatorAgent")
                    ) {
                      console.log(
                        "Found and removing raw events/agent data from chat content"
                      );

                      // Filter out all event lines
                      filteredContent = filteredContent.replace(
                        /event:.*?\n/g,
                        ""
                      );

                      // Filter out all raw SSE data lines
                      filteredContent = filteredContent.replace(
                        /data:.*?\n/g,
                        ""
                      );

                      // Filter out ping lines
                      filteredContent = filteredContent.replace(
                        /.*?: ping -.*?\n/g,
                        ""
                      );

                      // Filter out event blocks for all agent types
                      [
                        "ContextRetriever",
                        "ChatRouter",
                        "IntentAgent",
                        "StartParallelProcessing",
                        "ContentPlanner",
                        "PreviewGenerator",
                        "ValidatorAgent",
                        "PreviewFormatter",
                      ].forEach((agentType) => {
                        filteredContent = filteredContent.replace(
                          new RegExp(
                            `event: data[\\s\\S]*?${agentType}[\\s\\S]*?\\n\\n`,
                            "g"
                          ),
                          ""
                        );
                        filteredContent = filteredContent.replace(
                          new RegExp(
                            `data: \\{"${agentType}"[\\s\\S]*?}\\n\\n`,
                            "g"
                          ),
                          ""
                        );
                      });

                      // Clean up any double newlines or whitespace resulting from the removal
                      filteredContent = filteredContent.replace(
                        /\n{3,}/g,
                        "\n\n"
                      );
                      filteredContent = filteredContent.trim();
                    }
                  }

                  if (!assistantMsgIdToUpdate) {
                    const newAssistantMessageId = `assistant-${crypto.randomUUID()}`;
                    assistantMsgIdToUpdate = newAssistantMessageId;
                    accumulatedChatContent = filteredContent;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: newAssistantMessageId,
                        thread_id: threadIdRef.current || "unknown",
                        role: "assistant",
                        content: accumulatedChatContent,
                        created_at: new Date().toISOString(),
                        attachments: [],
                        preview_id: data.previewId,
                      },
                    ]);
                  } else {
                    accumulatedChatContent += filteredContent;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgIdToUpdate
                          ? {
                              ...msg,
                              content: accumulatedChatContent,
                              preview_id: data.previewId ?? msg.preview_id,
                            }
                          : msg
                      )
                    );
                  }
                  break;
                case "context":
                  // Store retrieved context in the preview metadata only (not shown directly in chat)
                  retrievedContext = data.content;
                  // Create a metadata panel for context if not already created
                  if (!contextPanelCreated) {
                    contextPanelCreated = true;
                    setPreviewData((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        retrievedContext: retrievedContext,
                      },
                    }));
                  } else {
                    // Update the existing panel
                    setPreviewData((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        retrievedContext: retrievedContext,
                      },
                    }));
                  }
                  break;
                case "status":
                  setProgress((prev) => ({
                    ...prev,
                    currentStep: data.currentStep ?? prev.currentStep,
                    messages: [...prev.messages, data.message].slice(-5),
                  }));
                  break;
                case "preview_update":
                  setPreviewData((prev) => ({
                    ...prev,
                    presentationContent:
                      data.presentationContent || prev.presentationContent,
                    metadata: {
                      ...prev.metadata,
                      ...(data.metadata || {}),
                      ...(data.presentationContent && {
                        title: extractTitle(data.presentationContent),
                      }),
                    },
                  }));
                  if (data.presentationContent && !isPreviewOpen) {
                    setIsPreviewOpen(true);
                  }
                  break;
                case "validation_result":
                  setPreviewData((prev) => ({
                    ...prev,
                    validation: data.validation || prev.validation,
                    metadata: {
                      ...prev.metadata,
                      validationStatus: data.validation?.status,
                      validationErrors: data.validation?.errors,
                    },
                  }));
                  break;
                case "error":
                  console.error("Stream Error:", data.message);
                  const errorMessage = data.message || "An error occurred";

                  // If the error is about authentication but we're continuing anyway,
                  // don't show it as an error to the user
                  if (
                    errorMessage.includes(
                      "Failed to create conversation, but continuing"
                    )
                  ) {
                    // Just log it but don't show as error
                    console.log(
                      "Working without persistent storage due to auth issues"
                    );

                    setProgress((prev) => ({
                      ...prev,
                      messages: [
                        ...prev.messages,
                        "Working in temporary mode due to authentication issues",
                      ],
                    }));

                    // Continue without creating an error message
                    continue;
                  }

                  // Check if we should fall back to v1
                  if (data.fallbackToV1 && !useV1Fallback) {
                    console.log(
                      "Received fallback instruction, retrying with v1 endpoint"
                    );

                    // Clean up the current processing state
                    abortController.abort();
                    clearTimeout(timeoutId);

                    // Remove the error message and retry with v1
                    setMessages((prev) =>
                      prev.filter((msg) => msg.id !== assistantMsgIdToUpdate)
                    );

                    // Recursive call with fallback flag
                    setTimeout(() => {
                      handleSendMessage();
                    }, 500);
                    return;
                  }

                  toast({
                    title: "Processing Error",
                    description: errorMessage,
                    variant: "destructive",
                  });
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `error-${crypto.randomUUID()}`,
                      thread_id: threadIdRef.current || "error",
                      role: "assistant",
                      content: `Error: ${errorMessage}. Please try again or rephrase your request.`,
                      created_at: new Date().toISOString(),
                      attachments: [],
                    },
                  ]);
                  return;
              }
            } else {
              // Non-JSON line - could be plain text or SSE events

              // Skip if it looks like an SSE event or ping
              if (
                line.startsWith("event:") ||
                line.startsWith("data:") ||
                line.includes(": ping -") ||
                line.includes("ContextRetriever") ||
                line.includes("ChatRouter") ||
                line.includes("IntentAgent") ||
                line.includes("StartParallelProcessing") ||
                line.includes("ContentPlanner") ||
                line.includes("PreviewGenerator") ||
                line.includes("ValidatorAgent") ||
                line.includes("PreviewFormatter")
              ) {
                console.log(
                  "Skipping SSE event or internal agent data in plain text:",
                  line.substring(0, 30) + "..."
                );
                continue;
              }

              // Otherwise, treat as V1 response - plain text
              const chatChunk = line;
              if (!assistantMsgIdToUpdate) {
                const newAssistantMessageId = `assistant-${crypto.randomUUID()}`;
                assistantMsgIdToUpdate = newAssistantMessageId;
                accumulatedChatContent = chatChunk;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: newAssistantMessageId,
                    thread_id: threadIdRef.current || "unknown",
                    role: "assistant",
                    content: accumulatedChatContent,
                    created_at: new Date().toISOString(),
                    attachments: [],
                  },
                ]);
              } else {
                accumulatedChatContent += chatChunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgIdToUpdate
                      ? {
                          ...msg,
                          content: accumulatedChatContent,
                        }
                      : msg
                  )
                );
              }
            }
          } catch (e) {
            console.error("Failed to parse stream line:", line, e);

            // Filter out SSE events and internal data in the error path as well
            if (
              line.startsWith("event:") ||
              line.startsWith("data:") ||
              line.includes(": ping -") ||
              line.includes("ContextRetriever") ||
              line.includes("ChatRouter") ||
              line.includes("IntentAgent") ||
              line.includes("StartParallelProcessing") ||
              line.includes("ContentPlanner") ||
              line.includes("PreviewGenerator") ||
              line.includes("ValidatorAgent") ||
              line.includes("PreviewFormatter")
            ) {
              console.log(
                "Skipping SSE event in error handler:",
                line.substring(0, 30) + "..."
              );
              continue;
            }

            // If it's not valid JSON and we're using v2, treat as plain text
            if (!useV1Fallback) {
              const chatChunk = line;
              if (!assistantMsgIdToUpdate) {
                const newAssistantMessageId = `assistant-${crypto.randomUUID()}`;
                assistantMsgIdToUpdate = newAssistantMessageId;
                accumulatedChatContent = chatChunk;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: newAssistantMessageId,
                    thread_id: threadIdRef.current || "unknown",
                    role: "assistant",
                    content: accumulatedChatContent,
                    created_at: new Date().toISOString(),
                    attachments: [],
                  },
                ]);
              } else {
                accumulatedChatContent += chatChunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgIdToUpdate
                      ? {
                          ...msg,
                          content: accumulatedChatContent,
                        }
                      : msg
                  )
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserId));
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (settings: LessonSettings) => {
    setLessonSettings(settings);
    console.log("Lesson settings updated:", settings);
  };

  const handleShowPreview = (previewId?: string) => {
    console.log("Showing preview, triggered by ID (if any):", previewId);
    setIsPreviewOpen(true);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-gray-900/90 via-black to-gray-900/90">
      <DropZone
        onFileSelect={handleFileSelect}
        isActive={dropZoneActive}
        setIsActive={setDropZoneActive}
        multiple={true}
        maxSize={10}
      />

      <motion.div
        className="flex-1 overflow-y-auto pb-48 overflow-x-hidden w-full"
        initial={false}
        animate={{
          width: isPreviewOpen ? (isPreviewFullscreen ? "0%" : "50%") : "100%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="mx-auto max-w-full px-4">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full max-w-4xl px-4 space-y-4">
                  <div className="space-y-2 text-center">
                    <p className="text-xl uppercase tracking-wider text-gray-400">
                      Hello{userName ? `, ${userName}` : ""}
                    </p>
                    <h1 className="text-4xl font-bold text-white">
                      {theme === "student" ? (
                        <span className="text-gray-400">
                          What would you like to{" "}
                          <span className="text-green-300">learn?</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          What lesson would you like to{" "}
                          <span className="text-blue-300">plan?</span>
                        </span>
                      )}
                    </h1>
                  </div>
                  <div className="relative rounded-lg border-2 border-gray-700/50 bg-gray-800/50 shadow-lg">
                    <HighlightedInput
                      ref={inputRef}
                      value={input}
                      onChange={(value) => setInput(value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        (e.preventDefault(), handleSendMessage())
                      }
                      placeholder={
                        theme === "student"
                          ? "Describe what you want to learn..."
                          : "Describe what you want to teach..."
                      }
                      className="w-full pl-4 pr-24 py-3 h-24 border-none focus:outline-none max-h-[200px] transition-all duration-200"
                      disabled={isLoading}
                      showInstructions={showInstructions}
                      onShowInstructionsChange={setShowInstructions}
                      onSettingsChange={handleSettingsChange}
                    />

                    <div className="absolute right-4 top-16 flex items-center gap-2">
                      <div data-tippy-content="Upload All Relevant Files">
                        <button
                          className="p-1 rounded-lg hover:bg-gray-800 transition-colors relative group"
                          onClick={() => setDropZoneActive(true)}
                          title="Upload All Relevant Files"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="text-sm font-medium mb-1">
                              Upload All Relevant Files
                            </div>
                            <div className="text-xs text-gray-300 max-w-xs">
                              Share any relevant materials like worksheets,
                              diagrams, or examples to help create better
                              content.
                            </div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                              <div className="border-solid border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
                            </div>
                          </div>
                        </button>
                      </div>
                      <button
                        className={cn(
                          "p-1 rounded-lg hover:bg-gray-800 transition-colors relative group",
                          showInstructions && "bg-gray-700/50"
                        )}
                        onClick={() => setShowInstructions(!showInstructions)}
                        title="Config"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-400"
                        >
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="text-sm font-medium mb-1">Config</div>
                          <div className="text-xs text-gray-300 max-w-xs">
                            Configure the format, audience, length and style of
                            the expected output
                          </div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="border-solid border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleSendMessage}
                        disabled={
                          isLoading ||
                          (!input.trim() && selectedImages.length === 0)
                        }
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          input.trim() || selectedImages.length > 0
                            ? "text-white hover:bg-gray-800"
                            : "text-gray-400 cursor-not-allowed",
                          isLoading && "pointer-events-none"
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="absolute left-4 bottom-2 flex items-center space-x-2 overflow-x-auto max-w-[50%] pb-1">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative group flex-shrink-0"
                          >
                            <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-600">
                              <img
                                src={preview}
                                alt={`Upload preview ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 rounded-full p-0.5 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {!showInstructions && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{
                          duration: 0.31,
                          ease: "easeInOut",
                        }}
                        className="grid grid-cols-3 gap-3 mt-6"
                      >
                        {(theme === "student"
                          ? examplePrompts.student
                          : examplePrompts.teacher
                        ).map((prompt, index) => (
                          <motion.button
                            key={index}
                            onClick={() => setInput(prompt.prompt)}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div
                              className={`rounded-full bg-gray-800 p-3 mb-3 ${
                                theme === "student"
                                  ? "text-green-400"
                                  : "text-blue-400"
                              }`}
                            >
                              {prompt.icon}
                            </div>
                            <span
                              className={`text-sm text-center ${
                                theme === "student"
                                  ? "text-green-100"
                                  : "text-blue-100"
                              }`}
                            >
                              {prompt.label}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id || `msg-${index}`}
                  messageId={msg.id}
                  role={msg.role}
                  content={msg.content}
                  hasPreview={
                    (!!previewData.presentationContent || !!msg.preview_id) &&
                    msg.role === "assistant"
                  }
                  previewId={msg.preview_id}
                  onShowPreview={handleShowPreview}
                />
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </motion.div>

      <AnimatePresence>
        {messages.some((m) => m.role === "assistant") && !isPreviewOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed right-4 top-4 z-40 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-md flex items-center gap-2 shadow-lg border border-gray-700"
            onClick={() => setIsPreviewOpen(true)}
            title="Show preview"
          >
            <PanelRight className="w-4 h-4" />
            <span className="text-sm">Show Preview</span>
          </motion.button>
        )}
      </AnimatePresence>

      {messages.length > 0 && (
        <div
          className={
            isPreviewOpen
              ? "chat-input-container-with-preview"
              : "mx-auto max-w-3xl w-full"
          }
        >
          <div className="px-4 mx-auto">
            <div className="relative mb-4 rounded-lg border border-gray-800 bg-gray-900/80 shadow-lg backdrop-blur">
              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b border-gray-800">
                  {selectedImages.map((file, index) => (
                    <div
                      key={index}
                      className="relative group bg-gray-800 rounded overflow-hidden border border-gray-700"
                    >
                      {file.type.startsWith("image/") && (
                        <div className="w-16 h-16 relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-1 right-1 bg-gray-900/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {!file.type.startsWith("image/") && (
                        <div className="w-16 h-16 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-1 right-1 bg-gray-900/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), handleSendMessage())
                  }
                  placeholder={
                    theme === "student" ? "Ask anything..." : "Enter details..."
                  }
                  className="flex-1 bg-transparent border-0 px-2 py-2 text-white placeholder-gray-500 focus:ring-0 focus:outline-none resize-none max-h-[150px] min-h-[40px]"
                  disabled={isLoading}
                  rows={1}
                />
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => setDropZoneActive(true)}>
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={handleSendMessage}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {uploadErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center p-2 mt-2 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-xs"
          >
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{uploadErrors.map((e) => e.error).join(", ")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPreviewOpen && (
          <PreviewPane
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            presentationContent={previewData.presentationContent || undefined}
            contentMetadata={previewData.metadata}
            validationData={previewData.validation}
            currentStep={progress.currentStep}
            progressSteps={progress.steps}
            statusMessages={progress.messages}
            isPreviewFullscreen={isPreviewFullscreen}
            toggleFullscreen={() => setIsPreviewFullscreen((prev) => !prev)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
