"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/user";
import type { ProgressActionResult } from "@/lib/progress/types";

/**
 * お知らせの既読化（Server Action）。
 *
 * ■ このファイルの決まりごと
 *   "use server" のファイルからは非同期関数以外を export しない。
 *   戻り値の型は @/lib/progress/types のものを使い回す。
 *
 * ■ なぜ Client の effect から呼ぶのか
 *   Next.js はリンクをホバーしただけで Server Component をプリフェッチする。
 *   詳細ページの Server Component 側で既読にすると、
 *   **一覧でマウスを乗せただけのお知らせが既読になってしまう**。
 *   実際にブラウザで表示されたときにだけ動く Client の effect から呼ぶのが正しい。
 *   （Phase 5 の視聴開始記録と同じ判断）
 *
 * ■ 何度呼ばれても壊れない
 *   複合主キーへの upsert なので、重複して呼ばれても状態は同じになる。
 */
export async function markAnnouncementRead(
  slug: string,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const supabase = await createClient();

  // RLS 越しに引くので、閲覧できないお知らせは解決できない（＝認可を兼ねる）
  const { data: announcement } = await supabase
    .from("announcements")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!announcement) return { ok: false, reason: "not-found" };

  const { error } = await supabase
    .from("announcement_reads")
    .upsert(
      { user_id: user.id, announcement_id: announcement.id },
      { onConflict: "user_id,announcement_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("[news] 既読の記録に失敗しました:", error.message);
    return { ok: false, reason: "failed" };
  }

  // ヘッダーの未読ドットはレイアウトで描いているため、レイアウトごと再検証する
  revalidatePath("/", "layout");
  return { ok: true };
}
