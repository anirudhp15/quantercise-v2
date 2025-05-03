export interface MessageAttachment {
  id: string;
  message_id: string;
  thread_id?: string; // Optional, might come from message context
  file_path: string;
  file_name: string;
  content_type: string;
  size?: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  attachments?: MessageAttachment[]; // Make optional as it might not always be present
  preview_id?: string; // Add this field based on usage in ChatMessage
  metadata?: Record<string, any>; // For any other potential fields
}
