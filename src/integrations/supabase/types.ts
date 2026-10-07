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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          case_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      case_updates: {
        Row: {
          case_id: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          published_at: string | null
          source_id: string | null
          summary: string | null
          title: string
          update_type: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          case_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          source_id?: string | null
          summary?: string | null
          title: string
          update_type?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          case_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          source_id?: string | null
          summary?: string | null
          title?: string
          update_type?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "case_updates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_updates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          attributed_claims: string | null
          case_number: string
          case_type: string
          checklist: Json
          country: string | null
          created_at: string
          created_by: string | null
          detention_date: string | null
          id: string
          known_facts: string | null
          last_known_update: string | null
          needs: string[]
          person_id: string | null
          person_status: Database["public"]["Enums"]["person_status"]
          public_visibility: boolean
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          review_notes: string | null
          reviewed_by: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          slug: string
          status_label: string | null
          story: string | null
          summary: string | null
          title: string
          unverified_info: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          attributed_claims?: string | null
          case_number?: string
          case_type?: string
          checklist?: Json
          country?: string | null
          created_at?: string
          created_by?: string | null
          detention_date?: string | null
          id?: string
          known_facts?: string | null
          last_known_update?: string | null
          needs?: string[]
          person_id?: string | null
          person_status?: Database["public"]["Enums"]["person_status"]
          public_visibility?: boolean
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          slug: string
          status_label?: string | null
          story?: string | null
          summary?: string | null
          title: string
          unverified_info?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          attributed_claims?: string | null
          case_number?: string
          case_type?: string
          checklist?: Json
          country?: string | null
          created_at?: string
          created_by?: string | null
          detention_date?: string | null
          id?: string
          known_facts?: string | null
          last_known_update?: string | null
          needs?: string[]
          person_id?: string | null
          person_status?: Database["public"]["Enums"]["person_status"]
          public_visibility?: boolean
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          slug?: string
          status_label?: string | null
          story?: string | null
          summary?: string | null
          title?: string
          unverified_info?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          message_type: string
          name: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          message_type: string
          name?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          message_type?: string
          name?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          submission_id: string | null
          title: string | null
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["doc_visibility"]
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          submission_id?: string | null
          title?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Update: {
          case_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          submission_id?: string | null
          title?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      help_actions: {
        Row: {
          case_id: string
          created_at: string
          description: string | null
          id: string
          safe: boolean
          title: string
          type: string
          url: string | null
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          case_id: string
          created_at?: string
          description?: string | null
          id?: string
          safe?: boolean
          title: string
          type: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string | null
          id?: string
          safe?: boolean
          title?: string
          type?: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "help_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          birth_year_if_safe: number | null
          city_if_safe: string | null
          country: string | null
          created_at: string
          display_name: string | null
          full_name: string
          id: string
          nationality: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          birth_year_if_safe?: number | null
          city_if_safe?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          birth_year_if_safe?: number | null
          city_if_safe?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          case_id: string | null
          created_at: string
          description: string
          id: string
          report_type: string
          reporter_email: string | null
          resolution: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          description: string
          id?: string
          report_type: string
          reporter_email?: string | null
          resolution?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          description?: string
          id?: string
          report_type?: string
          reporter_email?: string | null
          resolution?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          name: string
          notes: string | null
          publication_date: string | null
          reliability: string
          type: Database["public"]["Enums"]["source_type"]
          url: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name: string
          notes?: string | null
          publication_date?: string | null
          reliability?: string
          type?: Database["public"]["Enums"]["source_type"]
          url?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name?: string
          notes?: string | null
          publication_date?: string | null
          reliability?: string
          type?: Database["public"]["Enums"]["source_type"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          can_name_source: boolean | null
          case_id: string | null
          content: string
          created_at: string
          has_document: boolean
          id: string
          payload: Json
          reference_number: string
          review_notes: string | null
          reviewer_id: string | null
          risk_answer: string
          source_description: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submission_type: string
          submitter_email: string | null
          submitter_name: string | null
          updated_at: string
        }
        Insert: {
          can_name_source?: boolean | null
          case_id?: string | null
          content: string
          created_at?: string
          has_document?: boolean
          id?: string
          payload?: Json
          reference_number?: string
          review_notes?: string | null
          reviewer_id?: string | null
          risk_answer?: string
          source_description?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submission_type: string
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
        }
        Update: {
          can_name_source?: boolean | null
          case_id?: string | null
          content?: string
          created_at?: string
          has_document?: boolean
          id?: string
          payload?: Json
          reference_number?: string
          review_notes?: string | null
          reviewer_id?: string | null
          risk_answer?: string
          source_description?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submission_type?: string
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          case_id: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          source_id: string | null
          title: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          case_id: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          source_id?: string | null
          title: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          source_id?: string | null
          title?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_submission_document: {
        Args: {
          _file_name: string
          _file_path: string
          _file_type: string
          _submission_id: string
        }
        Returns: undefined
      }
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      case_is_public: { Args: { _case_id: string }; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      submit_contact: {
        Args: {
          _email: string
          _message: string
          _name: string
          _subject: string
          _type: string
        }
        Returns: undefined
      }
      submit_information: {
        Args: {
          _can_name_source: boolean
          _case_id: string
          _content: string
          _email: string
          _has_document: boolean
          _name: string
          _payload?: Json
          _risk: string
          _source: string
          _type: string
        }
        Returns: Json
      }
      submit_report: {
        Args: {
          _case_id: string
          _description: string
          _email: string
          _type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "contributor" | "reviewer" | "editor" | "admin"
      content_visibility: "PUBLIC" | "INTERNAL"
      doc_visibility: "PUBLIC" | "REVIEWERS_ONLY" | "INTERNAL" | "UNPUBLISHED"
      person_status: "DETAINED" | "RELEASED" | "MISSING" | "UNKNOWN" | "OTHER"
      publication_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "VERIFIED"
        | "PUBLISHED"
        | "ARCHIVED"
      report_status: "NEW" | "IN_REVIEW" | "RESOLVED" | "CLOSED"
      risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      source_type:
        | "OFFICIAL"
        | "NGO"
        | "MEDIA"
        | "DOCUMENT"
        | "WITNESS"
        | "FAMILY"
        | "OTHER"
      submission_status:
        | "PENDING"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "NEEDS_MORE_INFO"
        | "REJECTED"
        | "PUBLISHED"
      verification_status:
        | "VERIFIED"
        | "SOURCE_ONE"
        | "UNDER_VERIFICATION"
        | "LIMITED_INFORMATION"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["contributor", "reviewer", "editor", "admin"],
      content_visibility: ["PUBLIC", "INTERNAL"],
      doc_visibility: ["PUBLIC", "REVIEWERS_ONLY", "INTERNAL", "UNPUBLISHED"],
      person_status: ["DETAINED", "RELEASED", "MISSING", "UNKNOWN", "OTHER"],
      publication_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "VERIFIED",
        "PUBLISHED",
        "ARCHIVED",
      ],
      report_status: ["NEW", "IN_REVIEW", "RESOLVED", "CLOSED"],
      risk_level: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      source_type: [
        "OFFICIAL",
        "NGO",
        "MEDIA",
        "DOCUMENT",
        "WITNESS",
        "FAMILY",
        "OTHER",
      ],
      submission_status: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "NEEDS_MORE_INFO",
        "REJECTED",
        "PUBLISHED",
      ],
      verification_status: [
        "VERIFIED",
        "SOURCE_ONE",
        "UNDER_VERIFICATION",
        "LIMITED_INFORMATION",
      ],
    },
  },
} as const
