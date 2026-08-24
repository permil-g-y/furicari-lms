import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/user";
import type { Json } from "@/lib/supabase/database.types";

/**
 * 監査ログ。
 *
 * 目的は「監査ログ画面を作ること」ではなく、
 * 問い合わせ調査のときに **誰が / いつ / 何に対して / 何をしたか** が
 * 後から DB で追えること。閲覧 UI は Phase 7 の対象外。
 *
 * ■ 記録に失敗しても操作自体は失敗させない
 *   ログを書くのは状態を変えた **後** なので、ここで例外を投げると
 *   「変更は成功しているのに画面はエラー」になる。
 *   運営がやり直して二重に付与する事故のほうが実害が大きい。
 *   そのかわりサーバーログへ目立つ印を付けて出す。
 *
 * ■ actor_email を写しておく理由
 *   ログの価値は「後から分かる」ことにある。
 *   ユーザーが消えても誰の操作だったかが残るようにしておく。
 */
export type AdminAction =
  | "enrollment.grant"
  | "enrollment.revoke"
  | "enrollment.update_expiry"
  | "user.invite"
  | "lesson.publish"
  | "lesson.unpublish";

export async function recordAdminAction(input: {
  actor: Pick<SessionUser, "id" | "email">;
  action: AdminAction;
  targetType: "user" | "lesson" | "announcement";
  targetId?: string | null;
  /** 一覧で読める形の対象名（受講生名・レッスン名など） */
  targetLabel?: string | null;
  detail?: Record<string, Json>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("admin_audit_logs").insert({
      actor_id: input.actor.id,
      actor_email: input.actor.email,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      target_label: input.targetLabel ?? null,
      detail: input.detail ?? {},
    });
    if (error) {
      console.error(
        `[audit] 監査ログの記録に失敗しました action=${input.action} target=${input.targetId ?? "-"}: ${error.message}`,
      );
    }
  } catch (cause) {
    console.error(`[audit] 監査ログの記録で例外が発生しました action=${input.action}`, cause);
  }
}
