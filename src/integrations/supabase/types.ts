export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      backlinks: {
        Row: {
          campaign_id: string
          created_at: string | null
          error_message: string | null
          heading_generated: string | null
          id: string
          indexed_at: string | null
          indexed_blog_url: string | null
          status: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          error_message?: string | null
          heading_generated?: string | null
          id?: string
          indexed_at?: string | null
          indexed_blog_url?: string | null
          status?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          error_message?: string | null
          heading_generated?: string | null
          id?: string
          indexed_at?: string | null
          indexed_blog_url?: string | null
          status?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlinks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          category: string
          company_name: string
          completed_at: string | null
          created_at: string | null
          csv_file_path: string | null
          failed_backlinks: number | null
          id: string
          indexed_backlinks: number | null
          keyword_1: string
          keyword_2: string
          keyword_3: string
          keyword_4: string
          keyword_5: string
          location: string
          name: string
          page_type: string
          status: string | null
          total_backlinks: number | null
          updated_at: string | null
          user_id: string
          website_id: string
        }
        Insert: {
          category: string
          company_name: string
          completed_at?: string | null
          created_at?: string | null
          csv_file_path?: string | null
          failed_backlinks?: number | null
          id?: string
          indexed_backlinks?: number | null
          keyword_1: string
          keyword_2: string
          keyword_3: string
          keyword_4: string
          keyword_5: string
          location: string
          name: string
          page_type: string
          status?: string | null
          total_backlinks?: number | null
          updated_at?: string | null
          user_id: string
          website_id: string
        }
        Update: {
          category?: string
          company_name?: string
          completed_at?: string | null
          created_at?: string | null
          csv_file_path?: string | null
          failed_backlinks?: number | null
          id?: string
          indexed_backlinks?: number | null
          keyword_1?: string
          keyword_2?: string
          keyword_3?: string
          keyword_4?: string
          keyword_5?: string
          location?: string
          name?: string
          page_type?: string
          status?: string | null
          total_backlinks?: number | null
          updated_at?: string | null
          user_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      index_history: {
        Row: {
          backlinks_count: number
          campaign_id: string
          content_preview: string | null
          created_at: string | null
          heading: string
          id: string
          indexed_url: string
          user_id: string
          website_id: string
        }
        Insert: {
          backlinks_count: number
          campaign_id: string
          content_preview?: string | null
          created_at?: string | null
          heading: string
          id?: string
          indexed_url: string
          user_id: string
          website_id: string
        }
        Update: {
          backlinks_count?: number
          campaign_id?: string
          content_preview?: string | null
          created_at?: string | null
          heading?: string
          id?: string
          indexed_url?: string
          user_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "index_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "index_history_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      used_headings: {
        Row: {
          created_at: string | null
          heading: string
          id: string
          user_id: string
          website_id: string
        }
        Insert: {
          created_at?: string | null
          heading: string
          id?: string
          user_id: string
          website_id: string
        }
        Update: {
          created_at?: string | null
          heading?: string
          id?: string
          user_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "used_headings_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          groq_api_key: string | null
          id: string
          notification_email: boolean | null
          notification_failure: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          groq_api_key?: string | null
          id: string
          notification_email?: boolean | null
          notification_failure?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          groq_api_key?: string | null
          id?: string
          notification_email?: boolean | null
          notification_failure?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      websites: {
        Row: {
          category_id: number
          created_at: string | null
          heading_sheet_id: string | null
          heading_sheet_name: string | null
          id: string
          image_height: number | null
          image_model: string | null
          image_width: number | null
          last_tested_at: string | null
          name: string
          status: string | null
          updated_at: string | null
          url: string
          user_id: string
          wp_app_password: string
          wp_username: string
        }
        Insert: {
          category_id: number
          created_at?: string | null
          heading_sheet_id?: string | null
          heading_sheet_name?: string | null
          id?: string
          image_height?: number | null
          image_model?: string | null
          image_width?: number | null
          last_tested_at?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          url: string
          user_id: string
          wp_app_password: string
          wp_username: string
        }
        Update: {
          category_id?: number
          created_at?: string | null
          heading_sheet_id?: string | null
          heading_sheet_name?: string | null
          id?: string
          image_height?: number | null
          image_model?: string | null
          image_width?: number | null
          last_tested_at?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
          wp_app_password?: string
          wp_username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
