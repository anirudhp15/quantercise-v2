// Define shared types for the application

/**
 * Settings for educational content generation
 */
export interface LessonSettings {
  /** Type of content (worksheet, slideshow, etc.) */
  contentType: string;
  /** Target audience grade level */
  gradeLevel: string;
  /** Content length (brief, standard, extended) */
  length: string;
  /** Writing tone (academic, conversational, simplified) */
  tone: string;
}

/**
 * Chat API request interface
 */
export interface ChatRequest {
  /** User message content */
  message: string;
  /** Conversation/thread ID */
  threadId?: string;
  /** Attached images */
  images?: Array<{ path: string; type: string; name: string }>;
  /** Chat mode - student (learning) or teacher (teaching) */
  mode?: "student" | "teacher";
  /** Lesson generation settings */
  settings?: LessonSettings;
  /** Flag to create a new conversation */
  createNewThread?: boolean;
  /** Image data for direct upload */
  imageData?: {
    base64: string;
    contentType: string;
    filename: string;
    size: number;
  };
}

/**
 * Preview API request interface
 */
export interface PreviewRequest {
  /** Thread/conversation ID */
  threadId: string;
  /** Raw content */
  content: string;
  /** Chat-specific content */
  chatContent?: string;
  /** Presentation-specific content */
  presentationContent?: string;
  /** Content metadata */
  contentMetadata?: any;
  /** Status messages from generation process */
  statusMessages?: string[];
  /** Current processing step */
  currentStep?: number;
  /** Content type (worksheet, slideshow, etc.) */
  contentType?: string;
  /** Target audience */
  targetAudience?: string;
  /** Estimated content duration in minutes */
  estimatedDuration?: number;
  /** Content tone */
  tone?: string;
  /** Content complexity level */
  complexityLevel?: string;
  /** Subject area */
  subjectArea?: string;
  /** Tags for categorization */
  tags?: string[];
}
