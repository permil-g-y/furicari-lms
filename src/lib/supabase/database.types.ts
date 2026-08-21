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
export type ContentLevel = "beginner" | "intermediate" | "advanced";
/** lesson_progress.status。@/lib/types の LessonStatus と同じ値を持つ */
export type LessonProgressStatus = "not_started" | "in_progress" | "completed";
/** announcements.category。@/lib/types の AnnouncementCategory と同じ値を持つ */
export type AnnouncementCategoryDb =
  | "new_course"
  | "event"
  | "update"
  | "maintenance";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** courses.learn_points の中身 */
export type LearnPointJson = { title: string; note: string };

/* interface だと Record<string, unknown> 制約を満たさず supabase-js の型解決が
   壊れるため、必ず type エイリアスで定義する */
type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

/* Insert 型は interface 内で自己参照すると型解決が壊れるため外に出す */
export type CourseInsert = {
  slug: string;
  title: string;
  description?: string;
  long_description?: string | null;
  category_id?: string | null;
  level?: ContentLevel;
  cover_bg_color?: string;
  cover_icon?: string | null;
  cover_text?: string | null;
  cover_text_color?: string | null;
  duration_label?: string;
  learn_points?: LearnPointJson[];
  is_published?: boolean;
  sort_order?: number;
};

export type ChapterInsert = {
  course_id: string;
  slug: string;
  number: number;
  title: string;
  sort_order?: number;
};

export type AnnouncementInsert = {
  slug: string;
  title: string;
  category: AnnouncementCategoryDb;
  body?: Json;
  related_links?: Json;
  published_at?: string;
  is_published?: boolean;
};

export type LessonProgressInsert = {
  user_id: string;
  lesson_id: string;
  status?: LessonProgressStatus;
  position_seconds?: number;
  completed_at?: string | null;
  last_viewed_at?: string;
};

export type LessonInsert = {
  slug: string;
  course_id: string;
  chapter_id: string;
  number: number;
  title: string;
  description?: string | null;
  key_points?: string[];
  stream_video_id?: string | null;
  duration_seconds?: number;
  tool_id?: string | null;
  category_id?: string | null;
  level?: ContentLevel;
  is_published?: boolean;
  published_at?: string;
  sort_order?: number;
};

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
        Relationships: [];
      };

      categories: {
        Row: TimestampColumns & {
          id: string;
          slug: string;
          label: string;
          sort_order: number;
        };
        Insert: { slug: string; label: string; sort_order?: number };
        Update: { slug?: string; label?: string; sort_order?: number };
        Relationships: [];
      };

      tools: {
        Row: TimestampColumns & {
          id: string;
          slug: string;
          name: string;
          badge: string;
          gradient_from: string;
          gradient_to: string;
          ink: string;
          sort_order: number;
        };
        Insert: {
          slug: string;
          name: string;
          badge: string;
          gradient_from: string;
          gradient_to: string;
          ink: string;
          sort_order?: number;
        };
        Update: Partial<{
          slug: string;
          name: string;
          badge: string;
          gradient_from: string;
          gradient_to: string;
          ink: string;
          sort_order: number;
        }>;
        Relationships: [];
      };

      courses: {
        Row: TimestampColumns & {
          id: string;
          slug: string;
          title: string;
          description: string;
          long_description: string | null;
          category_id: string | null;
          level: ContentLevel;
          cover_bg_color: string;
          cover_icon: string | null;
          cover_text: string | null;
          cover_text_color: string | null;
          duration_label: string;
          learn_points: LearnPointJson[];
          is_published: boolean;
          sort_order: number;
        };
        Insert: CourseInsert;
        Update: Partial<CourseInsert>;
        Relationships: [];
      };

      chapters: {
        Row: TimestampColumns & {
          id: string;
          course_id: string;
          slug: string;
          number: number;
          title: string;
          sort_order: number;
        };
        Insert: ChapterInsert;
        Update: Partial<ChapterInsert>;
        Relationships: [];
      };

      lessons: {
        Row: TimestampColumns & {
          id: string;
          slug: string;
          course_id: string;
          chapter_id: string;
          number: number;
          title: string;
          description: string | null;
          key_points: string[];
          stream_video_id: string | null;
          duration_seconds: number;
          tool_id: string | null;
          category_id: string | null;
          level: ContentLevel;
          is_published: boolean;
          published_at: string;
          sort_order: number;
        };
        Insert: LessonInsert;
        Update: Partial<LessonInsert>;
        Relationships: [];
      };

      user_course_enrollments: {
        Row: {
          user_id: string;
          course_id: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          expires_at?: string | null;
        };
        Update: { expires_at?: string | null };
        Relationships: [];
      };

      /* ---- Phase 5: 学習進捗 -------------------------------------------- */

      /**
       * 視聴状態。行が存在しないレッスンは not_started として扱うため、
       * not_started の行は作らない。
       */
      lesson_progress: {
        Row: TimestampColumns & {
          user_id: string;
          lesson_id: string;
          status: LessonProgressStatus;
          position_seconds: number;
          completed_at: string | null;
          last_viewed_at: string;
        };
        Insert: LessonProgressInsert;
        Update: Partial<Omit<LessonProgressInsert, "user_id" | "lesson_id">>;
        Relationships: [];
      };

      lesson_view_events: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          viewed_at: string;
        };
        Insert: { user_id: string; lesson_id: string; viewed_at?: string };
        Update: { viewed_at?: string };
        Relationships: [];
      };

      lesson_favorites: {
        Row: { user_id: string; lesson_id: string; created_at: string };
        Insert: { user_id: string; lesson_id: string; created_at?: string };
        Update: { created_at?: string };
        Relationships: [];
      };

      course_favorites: {
        Row: { user_id: string; course_id: string; created_at: string };
        Insert: { user_id: string; course_id: string; created_at?: string };
        Update: { created_at?: string };
        Relationships: [];
      };

      /* ---- Phase 6: お知らせ ---------------------------------------------- */

      announcements: {
        Row: TimestampColumns & {
          id: string;
          slug: string;
          title: string;
          category: AnnouncementCategoryDb;
          /** AnnouncementBlock[] */
          body: Json;
          /** [{icon, label, href}] */
          related_links: Json;
          published_at: string;
          is_published: boolean;
        };
        Insert: AnnouncementInsert;
        Update: Partial<AnnouncementInsert>;
        Relationships: [];
      };

      announcement_reads: {
        Row: { user_id: string; announcement_id: string; read_at: string };
        Insert: { user_id: string; announcement_id: string; read_at?: string };
        Update: { read_at?: string };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      content_level: ContentLevel;
      lesson_status: LessonProgressStatus;
      announcement_category: AnnouncementCategoryDb;
    };
    CompositeTypes: Record<never, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
export type ChapterRow = Database["public"]["Tables"]["chapters"]["Row"];
export type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ToolRow = Database["public"]["Tables"]["tools"]["Row"];

export type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
export type LessonViewEventRow = Database["public"]["Tables"]["lesson_view_events"]["Row"];
export type LessonFavoriteRow = Database["public"]["Tables"]["lesson_favorites"]["Row"];
export type CourseFavoriteRow = Database["public"]["Tables"]["course_favorites"]["Row"];
export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementReadRow = Database["public"]["Tables"]["announcement_reads"]["Row"];
