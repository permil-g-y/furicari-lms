"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { LessonInsert } from "@/lib/supabase/database.types";
import { createDirectUpload, fetchVideoState, StreamApiError } from "@/lib/stream/api";
import { canPublishLesson } from "@/lib/stream/video-state";
import { getAdminLesson, getAdminLessons } from "./lesson-server";
import { syncTargets } from "./lessons";
import { recordAdminAction } from "./audit";

/**
 * レッスンの動画まわりの操作。
 *
 * Cloudflare の管理 API を叩くのはここだけ。
 * ブラウザへ API トークンは一切渡さない（渡すのは 1 回きりのアップロード URL のみ）。
 */

export type LessonActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string };

function revalidateLesson(slug: string) {
  revalidatePath("/admin/lessons");
  revalidatePath(`/admin/lessons/${slug}`);
  revalidatePath("/admin");
}

/**
 * アップロード URL の発行。
 *
 * **発行した時点で uid が確定する**ので、その場で lessons へ書き込む。
 * これにより「アップロード後に UID を探して貼る」照合処理が丸ごと不要になる。
 *
 * ただしアップロードが中断されると「uid はあるが動画が無い」状態が残るため、
 * 同時に stream_status を pending にしておく。
 * pending のレッスンは公開できない（canPublishLesson）。
 */
export async function startVideoUpload(
  slug: string,
): Promise<LessonActionResult<{ uploadUrl: string; uid: string }>> {
  await requireAdmin();

  const lesson = await getAdminLesson(slug);
  if (!lesson) return { ok: false, message: "レッスンが見つかりません。" };

  let upload;
  try {
    upload = await createDirectUpload({
      lessonSlug: lesson.slug,
      lessonTitle: `${lesson.courseTitle} / ${lesson.title}`,
    });
  } catch (cause) {
    const message =
      cause instanceof StreamApiError
        ? cause.message
        : "アップロード URL を発行できませんでした。";
    return { ok: false, message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      stream_video_id: upload.uid,
      stream_status: "pending",
      stream_synced_at: null,
      stream_error: null,
      // 差し替え中は公開したままにしない。再生できない動画を配らないため
      is_published: false,
    })
    .eq("id", lesson.id);

  if (error) {
    return { ok: false, message: `動画 ID を保存できませんでした: ${error.message}` };
  }

  revalidateLesson(slug);
  return { ok: true, data: { uploadUrl: upload.uploadUrl, uid: upload.uid } };
}

/**
 * Cloudflare から動画情報を取り直す。
 *
 * ■ 実尺をここで反映する
 *   Cloudflare は「まだ分からない」を -1 で返すため、そのまま保存しない。
 *
 * ■ 公開中の動画が壊れていたら自動的に非公開へ落とす（REVIEW 03）
 *   CHECK 制約で拒否すると、実際に起きたことを DB へ記録できなくなる。
 *   真実を記録したうえで、安全側（非公開）へ倒す。
 */
export async function syncVideoState(slug: string): Promise<LessonActionResult> {
  await requireAdmin();

  const lesson = await getAdminLesson(slug);
  if (!lesson) return { ok: false, message: "レッスンが見つかりません。" };
  if (!lesson.streamVideoId) {
    return { ok: false, message: "このレッスンにはまだ動画がありません。" };
  }

  let state;
  try {
    state = await fetchVideoState(lesson.streamVideoId);
  } catch (cause) {
    const message =
      cause instanceof StreamApiError ? cause.message : "動画情報を取得できませんでした。";
    return { ok: false, message };
  }

  const patch: Partial<LessonInsert> = {
    stream_status: state.status,
    stream_synced_at: new Date().toISOString(),
    stream_error: state.error,
  };
  if (state.durationSeconds !== null) {
    patch.duration_seconds = state.durationSeconds;
  }
  // 再生できない状態になっていたら公開を止める
  if (state.status !== "ready" && lesson.isPublished) {
    patch.is_published = false;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").update(patch).eq("id", lesson.id);
  if (error) {
    return { ok: false, message: `動画情報を保存できませんでした: ${error.message}` };
  }

  revalidateLesson(slug);
  return { ok: true };
}

/**
 * すべての動画つきレッスンの情報を取り直す。
 *
 * **動画を持つレッスンだけ**を対象にする（REVIEW 04）。
 * 動画の無いレッスンに問い合わせても Cloudflare には何も無い。
 */
export async function syncAllVideos(): Promise<
  LessonActionResult<{ synced: number; failed: number; skipped: number }>
> {
  await requireAdmin();

  const { lessons } = await getAdminLessons();
  const targets = syncTargets(lessons);

  let synced = 0;
  let failed = 0;
  for (const lesson of targets) {
    const result = await syncVideoState(lesson.slug);
    if (result.ok) synced += 1;
    else failed += 1;
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/admin");
  return {
    ok: true,
    data: { synced, failed, skipped: lessons.length - targets.length },
  };
}

/**
 * 公開 / 非公開の切り替え。
 *
 * 公開の可否は **サーバー側で判定する**（REVIEW 03）。
 * 画面のボタンを disabled にするだけでは、
 * クライアントから直接呼ばれた場合に素通りしてしまう。
 */
export async function setLessonPublished(
  slug: string,
  published: boolean,
): Promise<LessonActionResult> {
  const admin = await requireAdmin();

  const lesson = await getAdminLesson(slug);
  if (!lesson) return { ok: false, message: "レッスンが見つかりません。" };

  if (published) {
    const check = canPublishLesson({
      streamVideoId: lesson.streamVideoId,
      streamStatus: lesson.streamStatus,
    });
    if (!check.ok) return { ok: false, message: check.reason };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ is_published: published })
    .eq("id", lesson.id);

  if (error) {
    return { ok: false, message: `公開状態を保存できませんでした: ${error.message}` };
  }

  await recordAdminAction({
    actor: admin,
    action: published ? "lesson.publish" : "lesson.unpublish",
    targetType: "lesson",
    targetId: lesson.id,
    targetLabel: `${lesson.courseTitle} / ${lesson.title}`,
    detail: { lessonSlug: lesson.slug },
  });

  revalidateLesson(slug);
  // 受講生側の一覧・カリキュラムにも反映する
  revalidatePath("/", "layout");
  return { ok: true };
}
