import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/user";

/**
 * 再生位置の保存。
 *
 * ■ なぜ Server Action ではなく Route Handler なのか
 *   離脱時（タブを閉じる・別ページへ移る）の保存には
 *   `navigator.sendBeacon` が必要で、これは URL にしか送れない。
 *   Server Action は sendBeacon から呼べないため、この 1 本だけ Route Handler にする。
 *
 * ■ 何を信用しないか
 *   クライアントから来るのは「再生位置（秒）」だけ。
 *   完了かどうかの判定・レッスンの尺・ユーザー ID は**すべてサーバー側**で決める。
 *   position_seconds は既存値との max を取るので、
 *   古い値や 0 が届いても進捗が巻き戻らない
 *   （PC 用と Mobile 用のプレイヤーが同時に DOM 上へ存在するため、
 *     表示されていない側から 0 が送られ得る）。
 *
 * ■ 再検証しない
 *   30 秒ごとの保存でページを再検証すると、視聴中に画面が作り直されて
 *   再生が途切れる。進捗の表示は次の遷移時に更新されれば十分。
 */

/** この割合まで見たら完了とみなす */
const COMPLETION_RATIO = 0.9;

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return new Response(null, { status: 401 });

  const body = await request.json().catch(() => null);
  const lessonSlug = typeof body?.lessonId === "string" ? body.lessonId : null;
  const reported = Number(body?.positionSeconds);

  if (!lessonSlug || !Number.isFinite(reported) || reported < 0) {
    return new Response(null, { status: 400 });
  }

  /*
   * プレイヤーが報告した実際の動画の尺（任意）。
   * 完了判定の分母に使うだけで、権限には一切関わらない
   * （自分の進捗を完了にするのは「視聴済みにする」ボタンでも同じことができる）。
   */
  const reportedDuration = Number(body?.durationSeconds);
  const playerDuration =
    Number.isFinite(reportedDuration) && reportedDuration > 0 ? reportedDuration : null;

  const supabase = await createClient();

  // RLS 越しに引くので、閲覧できないレッスンはここで解決できない（＝認可を兼ねる）
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, duration_seconds")
    .eq("slug", lessonSlug)
    .maybeSingle();

  if (!lesson) return new Response(null, { status: 404 });

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("position_seconds, status, completed_at")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const duration = lesson.duration_seconds;
  const furthest = Math.max(reported, existing?.position_seconds ?? 0);

  // 保存する位置は DB の尺で丸める。
  // 画面の進捗率（getLessonPercent）はこの尺を分母にしているため、
  // ここを揃えておかないと 100% を超えた表示になり得る。
  const position = Math.min(Math.round(furthest), duration);

  /*
   * 完了判定は「実際の動画をどこまで見たか」で決める。
   * lessons.duration_seconds は編集者が入力する表示用の尺で、
   * アップロード済みファイルの実尺と食い違うことがある。
   * 例：テスト動画は実尺 58 秒だが DB 上は 765 秒。
   * これを分母にすると、最後まで見ても 7.6% にしかならず永久に完了しない。
   * プレイヤーが実尺を報告してきたときはそちらを優先する。
   */
  const basis = playerDuration ?? duration;

  // 一度 completed になったレッスンは、見直しても未完了へは戻さない
  const completed =
    existing?.status === "completed" ||
    (basis > 0 && Math.min(furthest, basis) / basis >= COMPLETION_RATIO);

  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lesson.id,
      status: completed ? "completed" : "in_progress",
      position_seconds: position,
      // 初めて完了したときだけ日時を書き、再視聴では上書きしない
      completed_at: completed ? (existing?.completed_at ?? nowIso) : null,
      last_viewed_at: nowIso,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    console.error("[progress] 再生位置の保存に失敗しました:", error.message);
    return new Response(null, { status: 500 });
  }

  return Response.json({
    status: completed ? "completed" : "in_progress",
    positionSeconds: position,
  });
}
