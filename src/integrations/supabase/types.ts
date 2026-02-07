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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          is_default: boolean | null
          label: string | null
          last_name: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          first_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_active: boolean
          name_en: string | null
          name_fr: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_fr: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_fr?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      category_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_en: string | null
          name_fr: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_fr: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_fr?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image: string | null
          cover_video: string | null
          created_at: string
          gallery_images: string[] | null
          id: string
          narrative_en: string | null
          narrative_fr: string | null
          published_at: string | null
          reference_code: string | null
          slug: string
          subtitle_en: string | null
          subtitle_fr: string | null
          tags: string[] | null
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          cover_video?: string | null
          created_at?: string
          gallery_images?: string[] | null
          id?: string
          narrative_en?: string | null
          narrative_fr?: string | null
          published_at?: string | null
          reference_code?: string | null
          slug: string
          subtitle_en?: string | null
          subtitle_fr?: string | null
          tags?: string[] | null
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          cover_video?: string | null
          created_at?: string
          gallery_images?: string[] | null
          id?: string
          narrative_en?: string | null
          narrative_fr?: string | null
          published_at?: string | null
          reference_code?: string | null
          slug?: string
          subtitle_en?: string | null
          subtitle_fr?: string | null
          tags?: string[] | null
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_runs: {
        Row: {
          created_at: string
          filename: string
          id: string
          report_json: Json
          stats_json: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          report_json?: Json
          stats_json?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          report_json?: Json
          stats_json?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          discount_total: number
          id: string
          items_json: Json
          made_to_measure_data_json: Json | null
          notes: string | null
          promo_code_id: string | null
          shipping_address_json: Json | null
          shipping_fee: number
          status: string
          stripe_session_id: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          discount_total?: number
          id?: string
          items_json?: Json
          made_to_measure_data_json?: Json | null
          notes?: string | null
          promo_code_id?: string | null
          shipping_address_json?: Json | null
          shipping_fee?: number
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          discount_total?: number
          id?: string
          items_json?: Json
          made_to_measure_data_json?: Json | null
          notes?: string | null
          promo_code_id?: string | null
          shipping_address_json?: Json | null
          shipping_fee?: number
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          category: string
          content_en: string | null
          content_en_json: Json | null
          content_fr: string | null
          content_fr_json: Json | null
          cover_image: string | null
          created_at: string
          event_date: string | null
          event_link: string | null
          event_location: string | null
          id: string
          lead_en: string | null
          lead_fr: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          category?: string
          content_en?: string | null
          content_en_json?: Json | null
          content_fr?: string | null
          content_fr_json?: Json | null
          cover_image?: string | null
          created_at?: string
          event_date?: string | null
          event_link?: string | null
          event_location?: string | null
          id?: string
          lead_en?: string | null
          lead_fr?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_en?: string | null
          content_en_json?: Json | null
          content_fr?: string | null
          content_fr_json?: Json | null
          cover_image?: string | null
          created_at?: string
          event_date?: string | null
          event_link?: string | null
          event_location?: string | null
          id?: string
          lead_en?: string | null
          lead_fr?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price_eur: number
          braiding_options: string[] | null
          care_en: string | null
          care_fr: string | null
          category: string
          category_id: string | null
          colors: string[] | null
          created_at: string
          description_en: string | null
          description_fr: string | null
          editorial_blocks_json: Json | null
          id: string
          images: string[] | null
          made_to_measure: boolean | null
          made_to_order: boolean | null
          made_to_order_max_days: number | null
          made_to_order_min_days: number | null
          materials: string[] | null
          materials_en: string | null
          materials_fr: string | null
          name_en: string
          name_fr: string
          preorder: boolean | null
          preorder_ship_date_estimate: string | null
          price_overrides: Json | null
          reference_code: string | null
          sizes: string[] | null
          slug: string
          status: string
          stock_qty: number | null
          story_en: string | null
          story_fr: string | null
          updated_at: string
        }
        Insert: {
          base_price_eur?: number
          braiding_options?: string[] | null
          care_en?: string | null
          care_fr?: string | null
          category: string
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          editorial_blocks_json?: Json | null
          id?: string
          images?: string[] | null
          made_to_measure?: boolean | null
          made_to_order?: boolean | null
          made_to_order_max_days?: number | null
          made_to_order_min_days?: number | null
          materials?: string[] | null
          materials_en?: string | null
          materials_fr?: string | null
          name_en: string
          name_fr: string
          preorder?: boolean | null
          preorder_ship_date_estimate?: string | null
          price_overrides?: Json | null
          reference_code?: string | null
          sizes?: string[] | null
          slug: string
          status?: string
          stock_qty?: number | null
          story_en?: string | null
          story_fr?: string | null
          updated_at?: string
        }
        Update: {
          base_price_eur?: number
          braiding_options?: string[] | null
          care_en?: string | null
          care_fr?: string | null
          category?: string
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          editorial_blocks_json?: Json | null
          id?: string
          images?: string[] | null
          made_to_measure?: boolean | null
          made_to_order?: boolean | null
          made_to_order_max_days?: number | null
          made_to_order_min_days?: number | null
          materials?: string[] | null
          materials_en?: string | null
          materials_fr?: string | null
          name_en?: string
          name_fr?: string
          preorder?: boolean | null
          preorder_ship_date_estimate?: string | null
          price_overrides?: Json | null
          reference_code?: string | null
          sizes?: string[] | null
          slug?: string
          status?: string
          stock_qty?: number | null
          story_en?: string | null
          story_fr?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string | null
          default_language: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_currency?: string | null
          default_language?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_currency?: string | null
          default_language?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          currency: string | null
          ends_at: string | null
          id: string
          max_redemptions: number | null
          starts_at: string | null
          times_redeemed: number | null
          type: string
          value: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          currency?: string | null
          ends_at?: string | null
          id?: string
          max_redemptions?: number | null
          starts_at?: string | null
          times_redeemed?: number | null
          type: string
          value?: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          currency?: string | null
          ends_at?: string | null
          id?: string
          max_redemptions?: number | null
          starts_at?: string | null
          times_redeemed?: number | null
          type?: string
          value?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
