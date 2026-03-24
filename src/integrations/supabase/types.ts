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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      itinerary_items: {
        Row: {
          amex_fhr: boolean | null
          cancellation_deadline: string | null
          confirmation_code: string | null
          cost: number | null
          created_at: string
          date: string | null
          day_index: number | null
          id: string
          latitude: number | null
          longitude: number | null
          payment_status: string | null
          points_used: number | null
          pref_match: boolean | null
          pro_tip: string | null
          subtitle: string | null
          time_label: string | null
          title: string | null
          trip_id: string
          type: string
        }
        Insert: {
          amex_fhr?: boolean | null
          cancellation_deadline?: string | null
          confirmation_code?: string | null
          cost?: number | null
          created_at?: string
          date?: string | null
          day_index?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          payment_status?: string | null
          points_used?: number | null
          pref_match?: boolean | null
          pro_tip?: string | null
          subtitle?: string | null
          time_label?: string | null
          title?: string | null
          trip_id: string
          type: string
        }
        Update: {
          amex_fhr?: boolean | null
          cancellation_deadline?: string | null
          confirmation_code?: string | null
          cost?: number | null
          created_at?: string
          date?: string | null
          day_index?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          payment_status?: string | null
          points_used?: number | null
          pref_match?: boolean | null
          pro_tip?: string | null
          subtitle?: string | null
          time_label?: string | null
          title?: string | null
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_cards: Json | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          travel_preferences: Json | null
          updated_at: string
        }
        Insert: {
          active_cards?: Json | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          travel_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          active_cards?: Json | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          travel_preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          destination: string | null
          end_date: string | null
          id: string
          is_published: boolean
          start_date: string | null
          target_nightly_budget: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean
          start_date?: string | null
          target_nightly_budget?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean
          start_date?: string | null
          target_nightly_budget?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      itinerary_items_public: {
        Row: {
          amex_fhr: boolean | null
          cancellation_deadline: string | null
          confirmation_code: string | null
          cost: number | null
          created_at: string | null
          date: string | null
          day_index: number | null
          id: string | null
          latitude: number | null
          longitude: number | null
          payment_status: string | null
          points_used: number | null
          pref_match: boolean | null
          pro_tip: string | null
          subtitle: string | null
          time_label: string | null
          title: string | null
          trip_id: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
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
