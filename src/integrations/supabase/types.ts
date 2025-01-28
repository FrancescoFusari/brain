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
      batch_processing_queue: {
        Row: {
          analyzed_category: string | null
          analyzed_tags: string[] | null
          analyzed_title: string | null
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          input_type: string
          processed_at: string | null
          source_image_path: string | null
          source_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          analyzed_category?: string | null
          analyzed_tags?: string[] | null
          analyzed_title?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_type: string
          processed_at?: string | null
          source_image_path?: string | null
          source_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          analyzed_category?: string | null
          analyzed_tags?: string[] | null
          analyzed_title?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_type?: string
          processed_at?: string | null
          source_image_path?: string | null
          source_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          note_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processing_queue: {
        Row: {
          created_at: string
          email_body: string | null
          email_id: string
          error_message: string | null
          id: string
          processed_at: string | null
          received_at: string
          sender: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_body?: string | null
          email_id: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          received_at: string
          sender: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_body?: string | null
          email_id?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          received_at?: string
          sender?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_integrations: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      graph_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          input_type: string | null
          metadata: Json | null
          source_image_path: string | null
          source_url: string | null
          tags: string[]
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          input_type?: string | null
          metadata?: Json | null
          source_image_path?: string | null
          source_url?: string | null
          tags?: string[]
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          input_type?: string | null
          metadata?: Json | null
          source_image_path?: string | null
          source_url?: string | null
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      tag_categories: {
        Row: {
          categories: Json
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          categories: Json
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tag_relationships: {
        Row: {
          child_tag: string
          created_at: string
          id: string
          parent_tag: string
          relationship_type: string
          user_id: string
        }
        Insert: {
          child_tag: string
          created_at?: string
          id?: string
          parent_tag: string
          relationship_type?: string
          user_id: string
        }
        Update: {
          child_tag?: string
          created_at?: string
          id?: string
          parent_tag?: string
          relationship_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      combined_notes_view: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string | null
          input_type: string | null
          source: string | null
          source_image_path: string | null
          source_url: string | null
          tags: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      rate_limit_check: {
        Args: {
          check_user_id: string
          requests_limit?: number
          window_minutes?: number
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
