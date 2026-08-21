"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/user";
import type { ProgressActionResult } from "@/lib/progress/types";

/**
 * プロフィール設定の更新（Server Action）。
 *
 * ■ 更新できるのは 3 列だけ
 *   profiles は列レベル権限で display_name / avatar_url / notification_enabled
 *   だけが更新可能になっており、role は
 *   「列権限」と「BEFORE UPDATE トリガー」の二層で保護されている。
 *   ここで role を触ろうとしても SQL レベルで拒否される。
 *
 * ■ user_id は画面から渡させない
 *   必ずサーバー側のセッションから取る。
 */

/** 表示名の最大文字数。長すぎるとヘッダーやカードのレイアウトが崩れる */
const DISPLAY_NAME_MAX = 40;

export async function updateDisplayName(
  rawName: string,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const displayName = rawName.trim();
  if (displayName.length === 0 || displayName.length > DISPLAY_NAME_MAX) {
    return { ok: false, reason: "not-found" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    console.error("[profile] 表示名の更新に失敗しました:", error.message);
    return { ok: false, reason: "failed" };
  }

  // ヘッダーの表示名もレイアウトで描いているため、レイアウトごと再検証する
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * メール通知の受け取り設定。
 *
 * ここで保存できるのは「受け取る / 受け取らない」の意思表示まで。
 * 実際の送信は Custom SMTP を設定してから有効になる。
 */
export async function updateNotificationEnabled(
  enabled: boolean,
): Promise<ProgressActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ notification_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("[profile] 通知設定の更新に失敗しました:", error.message);
    return { ok: false, reason: "failed" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
