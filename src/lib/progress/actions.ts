"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/user";
import type { ProgressActionResult } from "./types";

/**
 * 学習進捗の書き込み（Server Actions）。
 *
 * ■ このファイルの決まりごと
 *   "use server" のファイルからは **非同期関数以外を export しない**。
 *   型は ./types.ts に置いてある（src/lib/auth/actions.ts と同じ制約）。
 *
 * ■ slug → uuid の解決
 *   画面から渡ってくるのは slug。進捗テーブルの外部キーは uuid なので、
 *   ここで 1 件だけ引いて変換する。教材を全件取り直すより軽い。
 *   このクエリは RLS を通るため、**閲覧できないレッスンは解決できない**。
 *   つまり変換そのものが認可チェックを兼ねている。
 *
 * ■ 認証
 *   user_id は必ずサーバー側のセッションから取る。
 *   画面から渡させると他人の行を書けてしまう（RLS でも弾かれるが、
 *   そもそも渡さない設計にしておく）。
 */

async function resolveLessonId(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * 学習履歴を記録する。
 *
 * 同じレッスンの直近イベントが SESSION_MS 以内なら、新しい行を作らず時刻だけ更新する。
 * これをしないと、1 本の動画を見ている間に履歴が何行も増えてしまう。
 * 再訪の時刻へ更新するので「最近見た動画」の並びも正しくなる。
 */
const SESSION_MS = 30 * 60 * 1000;

async function recordViewEvent(userId: string, lessonId: string, nowIso: string) {
  const supabase = await createClient();

  const { data: recent } = await supabase
    .from("lesson_view_events")
    .select("id, viewed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("viewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - Date.parse(recent.viewed_at) < SESSION_MS) {
    await supabase
      .from("lesson_view_events")
      .update({ viewed_at: nowIso })
      .eq("id", recent.id);
    return;
  }

  await supabase
    .from("lesson_view_events")
    .insert({ user_id: userId, lesson_id: lessonId, viewed_at: nowIso });
}

/**
 * 進捗が変わったことを画面へ反映させる。
 *
 * 進捗はルートレイアウトで 1 回だけ取得して全ページへ配っているため、
 * レイアウトごと再検証する。これで TOP・コース詳細・履歴・マイページの
 * 数値が同時に更新される。
 */
function revalidateProgress() {
  revalidatePath("/", "layout");
}

async function resolveCourseId(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * 動画を開いたことを記録する（視聴開始 → in_progress）。
 *
 * ■ なぜ Client の effect から呼ぶのか
 *   Next.js はリンクをホバーしただけで Server Component をプリフェッチする。
 *   watch ページの Server Component 側で記録すると、
 *   **実際には見ていない動画の履歴が作られてしまう**。
 *   実際にブラウザで表示されたときだけ動く Client の effect から呼ぶのが正しい。
 *
 * ■ 何度呼ばれても壊れない
 *   開発時の StrictMode は effect を 2 回実行する。
 *   既存行があれば last_viewed_at だけ更新し、履歴もセッション単位でまとめるので、
 *   重複して呼ばれても状態は同じになる。
 *
 * ■ 完了済みのレッスンを開き直しても completed は保つ
 *   進捗を巻き戻さない。再視聴は「もう一度見ている」だけで未完了ではない。
 */
export async function markLessonStarted(
  lessonSlug: string,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const lessonId = await resolveLessonId(lessonSlug);
  if (!lessonId) return { ok: false, reason: "not-found" };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("lesson_progress")
      .update({ last_viewed_at: nowIso })
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
    if (error) {
      console.error("[progress] 視聴時刻の更新に失敗しました:", error.message);
      return { ok: false, reason: "failed" };
    }
  } else {
    const { error } = await supabase.from("lesson_progress").insert({
      user_id: user.id,
      lesson_id: lessonId,
      status: "in_progress",
      position_seconds: 0,
      completed_at: null,
      last_viewed_at: nowIso,
    });
    if (error) {
      console.error("[progress] 視聴開始の記録に失敗しました:", error.message);
      return { ok: false, reason: "failed" };
    }
  }

  await recordViewEvent(user.id, lessonId, nowIso);
  revalidateProgress();
  return { ok: true };
}

/**
 * 「視聴済みにする」トグル。
 *
 * completed_at は **初めて完了したときだけ** 書き、再視聴では上書きしない。
 * 完了を取り消したときは NULL へ戻す（DB 側の CHECK 制約が
 * status と completed_at の食い違いを許さないため、必ず対で更新する）。
 *
 * position_seconds には触らない。
 * 完了レッスンの学習時間は「尺いっぱい見た」として集計側で扱うので、
 * 完了を取り消せば実際の到達位置に自然と戻る。
 */
export async function setLessonCompleted(
  lessonSlug: string,
  completed: boolean,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const lessonId = await resolveLessonId(lessonSlug);
  if (!lessonId) return { ok: false, reason: "not-found" };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("position_seconds, completed_at")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: completed ? "completed" : "in_progress",
      position_seconds: existing?.position_seconds ?? 0,
      completed_at: completed ? (existing?.completed_at ?? nowIso) : null,
      last_viewed_at: nowIso,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    console.error("[progress] 視聴状態の更新に失敗しました:", error.message);
    return { ok: false, reason: "failed" };
  }

  await recordViewEvent(user.id, lessonId, nowIso);
  revalidateProgress();
  return { ok: true };
}

/**
 * 動画のお気に入りを設定する。
 * favorite を明示的に受け取るトグルではない形にしてあるのは、
 * 通信が前後しても最後に送った状態へ収束させるため。
 */
export async function setLessonFavorite(
  lessonSlug: string,
  favorite: boolean,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const lessonId = await resolveLessonId(lessonSlug);
  if (!lessonId) return { ok: false, reason: "not-found" };

  const supabase = await createClient();

  if (favorite) {
    const { error } = await supabase
      .from("lesson_favorites")
      .upsert(
        { user_id: user.id, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );
    if (error) {
      console.error("[progress] お気に入りの追加に失敗しました:", error.message);
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from("lesson_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId);
  if (error) {
    console.error("[progress] お気に入りの解除に失敗しました:", error.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}

/** コースのお気に入りを設定する */
export async function setCourseFavorite(
  courseSlug: string,
  favorite: boolean,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const courseId = await resolveCourseId(courseSlug);
  if (!courseId) return { ok: false, reason: "not-found" };

  const supabase = await createClient();

  if (favorite) {
    const { error } = await supabase
      .from("course_favorites")
      .upsert(
        { user_id: user.id, course_id: courseId },
        { onConflict: "user_id,course_id", ignoreDuplicates: true },
      );
    if (error) {
      console.error("[progress] コースのお気に入り追加に失敗しました:", error.message);
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from("course_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("course_id", courseId);
  if (error) {
    console.error("[progress] コースのお気に入り解除に失敗しました:", error.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}
