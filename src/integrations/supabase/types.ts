export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      book_chapters: {
        Row: {
          book_id: string;
          char_count: number;
          content: string;
          id: string;
          idx: number;
          title: string;
          user_id: string;
        };
        Insert: {
          book_id: string;
          char_count?: number;
          content: string;
          id?: string;
          idx: number;
          title: string;
          user_id: string;
        };
        Update: {
          book_id?: string;
          char_count?: number;
          content?: string;
          id?: string;
          idx?: number;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_chapters_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarks: {
        Row: {
          book_id: string;
          chapter_idx: number;
          char_offset: number;
          created_at: string;
          id: string;
          label: string | null;
          user_id: string;
        };
        Insert: {
          book_id: string;
          chapter_idx: number;
          char_offset?: number;
          created_at?: string;
          id?: string;
          label?: string | null;
          user_id: string;
        };
        Update: {
          book_id?: string;
          chapter_idx?: number;
          char_offset?: number;
          created_at?: string;
          id?: string;
          label?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      books: {
        Row: {
          author: string | null;
          chapter_count: number;
          collection_id: string | null;
          cover_path: string | null;
          created_at: string;
          description: string | null;
          file_path: string | null;
          id: string;
          last_read_at: string | null;
          title: string;
          total_chars: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          author?: string | null;
          chapter_count?: number;
          collection_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          file_path?: string | null;
          id?: string;
          last_read_at?: string | null;
          title: string;
          total_chars?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          author?: string | null;
          chapter_count?: number;
          collection_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          file_path?: string | null;
          id?: string;
          last_read_at?: string | null;
          title?: string;
          total_chars?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          book_id: string;
          chapter_idx: number;
          created_at: string;
          end_offset: number;
          id: string;
          start_offset: number;
          text: string;
          user_id: string;
        };
        Insert: {
          book_id: string;
          chapter_idx: number;
          created_at?: string;
          end_offset: number;
          id?: string;
          start_offset: number;
          text: string;
          user_id: string;
        };
        Update: {
          book_id?: string;
          chapter_idx?: number;
          created_at?: string;
          end_offset?: number;
          id?: string;
          start_offset?: number;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          body: string;
          book_id: string;
          chapter_idx: number;
          char_offset: number;
          created_at: string;
          highlight_id: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: string;
          book_id: string;
          chapter_idx?: number;
          char_offset?: number;
          created_at?: string;
          highlight_id?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          book_id?: string;
          chapter_idx?: number;
          char_offset?: number;
          created_at?: string;
          highlight_id?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_highlight_id_fkey";
            columns: ["highlight_id"];
            isOneToOne: false;
            referencedRelation: "highlights";
            referencedColumns: ["id"];
          },
        ];
      };
      preferences: {
        Row: {
          font_family: string;
          font_size: number;
          line_height: number;
          margin: number;
          playback_rate: number;
          theme: string;
          updated_at: string;
          user_id: string;
          voice: string | null;
          voice_provider: string;
        };
        Insert: {
          font_family?: string;
          font_size?: number;
          line_height?: number;
          margin?: number;
          playback_rate?: number;
          theme?: string;
          updated_at?: string;
          user_id: string;
          voice?: string | null;
          voice_provider?: string;
        };
        Update: {
          font_family?: string;
          font_size?: number;
          line_height?: number;
          margin?: number;
          playback_rate?: number;
          theme?: string;
          updated_at?: string;
          user_id?: string;
          voice?: string | null;
          voice_provider?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      reading_progress: {
        Row: {
          book_id: string;
          chapter_idx: number;
          char_offset: number;
          percent: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          book_id: string;
          chapter_idx?: number;
          char_offset?: number;
          percent?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          book_id?: string;
          chapter_idx?: number;
          char_offset?: number;
          percent?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: true;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
