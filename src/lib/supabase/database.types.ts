/**
 * Supabase Database の型定義。
 *
 * supabase/migrations/*.sql と 1:1 で対応させている。
 * Supabase CLI が使える環境では以下で再生成できる（package.json の
 * `npm run types:supabase` も同じことをする）。
 *
 *   npx supabase gen types typescript --project-id <PROJECT_REF> > src/lib/supabase/database.types.ts
 *
 * 再生成した場合はこのコメントが消えるが問題ない。
 */

export type UserRole = "student" | "admin";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          notification_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          notification_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        /**
         * role / id / created_at / updated_at は列権限とトリガーで保護しており、
         * 本人からは更新できない（updated_at はトリガーが自動更新する）。
         */
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          notification_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<never, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
