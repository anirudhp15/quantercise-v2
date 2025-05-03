import { User } from "@clerk/nextjs/server";
import { LessonSettings } from "@/types";

export type Role = "user" | "assistant" | "system";

export interface Message {
  id?: string;
  thread_id?: string;
  role: Role;
  content: string;
  created_at?: string;
  attachments?: MessageAttachment[];
  preview_id?: string;
}

export interface MessageAttachment {
  id: string;
  message_id?: string;
  thread_id: string;
  type: string;
  file_path: string;
  file_name: string;
  content_type: string;
  created_at: string;
}

export interface ChatState {
  messages: Message[];
  mode: "student" | "teacher";
  conversationId?: string;
  streaming?: boolean;
}

export interface ToolCallConfig {
  tool: string;
  tool_input: Record<string, unknown>;
}

export interface ChatConfig {
  mode: "student" | "teacher";
  systemPrompt?: string;
  conversationId?: string;
  streaming?: boolean;
}

export interface StreamChatOptions {
  mode: "student" | "teacher";
  threadId?: string;
  createNewThread?: boolean;
  clerkUser?: User;
  supabaseUserId?: string;
  imageData?: {
    base64: string;
    contentType: string;
    filename: string;
    size: number;
  };
  storedImagePath?: string;
  structuredOutput?: boolean;
  settings?: LessonSettings;
}
