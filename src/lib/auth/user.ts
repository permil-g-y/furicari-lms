import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";

/** 画面表示に必要な、ログインユーザーの最小限の情報 */
export type SessionUser = {
  id: string;
  email: string;
  /** profiles.display_name。未設定ならメールアドレスから生成したフォールバック */
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  notificationEnabled: boolean;
  /** 「2026年8月19日から利用中」の表示に使う（profiles.created_at 由来） */
  joinedLabel: string;
  /** display_name が未設定（招待直後など）かどうか */
  hasDisplayName: boolean;
};

/** ISO 日時 → 「2026年8月19日から利用中」 */
function formatJoinedLabel(createdAt: string | undefined): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
  return `${formatted}から利用中`;
}

/**
 * display_name が無いときの表示名。
 * 招待直後は display_name が空になり得るため、必ずフォールバックを返す。
 */
export function fallbackDisplayName(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  return localPart.length > 0 ? localPart : "受講生";
}

/**
 * 認証済みユーザーの ID とメールアドレスを返す。未ログインなら null。
 *
 * getSession() はサーバー側で信用してはいけないため、JWT の署名を検証する
 * getClaims() を使う。
 *
 * cache() で包んでいるのは、1 リクエストの中で複数の入口
 * （レイアウトの requireUser・教材取得・Server Action）から呼ばれても
 * 検証を 1 回に集約するため。Cookie はリクエスト中に変わらないので安全。
 */
export const getAuthUser = cache(
  async (): Promise<{ id: string; email: string } | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    const claims = data?.claims;
    if (error || !claims?.sub) return null;

    let email = typeof claims.email === "string" ? claims.email : "";
    if (!email) {
      // email クレームが無い設定のプロジェクト向けフォールバック
      const { data: userData } = await supabase.auth.getUser();
      email = userData.user?.email ?? "";
    }

    return { id: claims.sub, email };
  },
);

/** profiles を 1 件取得する（RLS により自分の行しか取得できない） */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data ?? null;
}

/**
 * ログインユーザーの表示用情報。未ログインなら null。
 * profiles がまだ生成されていない場合でも壊れないようにしてある。
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const profile = await getProfile(authUser.id);
  const displayName = profile?.display_name?.trim() ?? "";

  return {
    id: authUser.id,
    email: authUser.email,
    displayName: displayName || fallbackDisplayName(authUser.email),
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role ?? "student",
    notificationEnabled: profile?.notification_enabled ?? true,
    joinedLabel: formatJoinedLabel(profile?.created_at),
    hasDisplayName: displayName.length > 0,
  };
}

/**
 * 認証必須ページ用。未ログインなら /login へリダイレクトする。
 *
 * proxy.ts でも保護しているが、サーバー側でも必ず検証することで
 * proxy を通らない経路（直接の Server Action 実行など）にも耐える。
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
