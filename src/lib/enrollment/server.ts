import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ContentIdMaps } from "@/lib/content/snapshot";
import { isEnrollmentActive, type EnrollmentAccess } from "./access";

/**
 * 受講権限の取得。
 *
 * 教材と同じリクエスト内で 1 回だけ引く。1 ユーザーあたり最大でもコース数分
 * （現在 6 行）なので、コースごとに問い合わせる必要はない。
 *
 * 期限の判定はここで済ませ、呼び出し側には「いま有効なコース」だけを渡す。
 * uuid は外へ出さず slug に写す（教材・進捗と同じ方針）。
 */

/** テーブル未作成（マイグレーション未適用）を表す PostgREST のコード */
const TABLE_MISSING = "PGRST205";

export async function loadEnrollmentAccess(input: {
  supabase: SupabaseClient<Database>;
  /** 未ログインなら null */
  userId: string | null;
  isAdmin: boolean;
  maps: ContentIdMaps;
  now?: Date;
}): Promise<EnrollmentAccess> {
  const { supabase, userId, isAdmin, maps } = input;
  const now = input.now ?? new Date();

  if (!userId) return { enrolledCourseIds: new Set(), isAdmin };

  const { data, error } = await supabase
    .from("user_course_enrollments")
    .select("course_id, expires_at")
    .eq("user_id", userId);

  if (error?.code === TABLE_MISSING) {
    // 受講権限テーブルが無い環境では、誰も受講していない扱いにする（安全側）
    return { enrolledCourseIds: new Set(), isAdmin };
  }

  if (error) {
    throw new Error(`[enrollment] 受講権限の取得に失敗しました: ${error.message} (${error.code})`);
  }

  const enrolledCourseIds = new Set<string>();
  for (const row of data ?? []) {
    if (!isEnrollmentActive(row.expires_at, now)) continue;
    const slug = maps.courseSlugByUuid.get(row.course_id);
    if (slug) enrolledCourseIds.add(slug);
  }

  return { enrolledCourseIds, isAdmin };
}
