export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          content_type: string
          conversation_id: string
          created_at: string
          file_name: string
          file_path: string
          height: number | null
          id: string
          message_id: string
          size: number | null
          type: string
          width: number | null
        }
        Insert: {
          content_type: string
          conversation_id: string
          created_at?: string
          file_name: string
          file_path: string
          height?: number | null
          id?: string
          message_id: string
          size?: number | null
          type: string
          width?: number | null
        }
        Update: {
          content_type?: string
          conversation_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          height?: number | null
          id?: string
          message_id?: string
          size?: number | null
          type?: string
          width?: number | null
        }
        Relationships: []
      }
      message_previews: {
        Row: {
          chat_content: string | null
          content: string
          content_metadata: Json | null
          created_at: string | null
          current_step: number | null
          id: string
          message_id: string
          presentation_content: string | null
          status_messages: Json | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          chat_content?: string | null
          content: string
          content_metadata?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          message_id: string
          presentation_content?: string | null
          status_messages?: Json | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          chat_content?: string | null
          content?: string
          content_metadata?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          message_id?: string
          presentation_content?: string | null
          status_messages?: Json | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clerk_id: string
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          clerk_id: string
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          clerk_id?: string
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      threads: {
        Row: {
          clerk_id: string | null
          created_at: string
          id: string
          mode: string
          preview_content: string | null
          preview_metadata: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clerk_id?: string | null
          created_at?: string
          id?: string
          mode: string
          preview_content?: string | null
          preview_metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clerk_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          preview_content?: string | null
          preview_metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_thread_in_group: {
        Args: {
          p_title: string
          p_clerk_id: string
          p_parent_id?: string
          p_group_name?: string
        }
        Returns: string
      }
      get_clerk_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_thread_preview: {
        Args: { p_thread_id: string }
        Returns: {
          id: string
          thread_id: string
          content: string
          chat_content: string
          presentation_content: string
          content_metadata: Json
          status_messages: Json
          current_step: number
          sequence_order: number
          created_at: string
          updated_at: string
          metadata_id: string
          content_type: string
          target_audience: string
          estimated_duration: number
          tone: string
          complexity_level: string
          subject_area: string
          tags: string[]
          custom_settings: Json
        }[]
      }
      get_threads_in_group: {
        Args: { p_group_name?: string; p_clerk_id?: string }
        Returns: {
          id: string
          title: string
          clerk_id: string
          parent_thread_id: string
          display_order: number
          group_name: string
          created_at: string
          updated_at: string
          message_count: number
        }[]
      }
      organize_thread: {
        Args: {
          thread_id: string
          new_parent_id?: string
          new_display_order?: number
          new_group_name?: string
        }
        Returns: undefined
      }
      save_content_metadata: {
        Args: {
          p_thread_id: string
          p_preview_id: string
          p_content_type?: string
          p_target_audience?: string
          p_estimated_duration?: number
          p_tone?: string
          p_complexity_level?: string
          p_subject_area?: string
          p_tags?: string[]
          p_custom_settings?: Json
        }
        Returns: string
      }
      save_thread_preview: {
        Args: {
          p_thread_id: string
          p_content: string
          p_chat_content?: string
          p_presentation_content?: string
          p_metadata?: Json
          p_status_messages?: Json
          p_current_step?: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
