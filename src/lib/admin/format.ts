import { jstDateKey } from "@/lib/content/format";
import type { AccountState, EnrollmentState } from "./students";

/**
 * 管理画面の表示ラベル。
 *
 * 日付は必ず JST で解釈する。Supabase も Vercel も UTC で動いているため、
 * 素直に toLocaleDateString すると日付が 1 日ずれる（Phase 5 で踏んだ）。
 */

/** ISO 日時 → 「2026/08/22」。null なら「—」 */
export function adminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return jstDateKey(date).replace(/-/g, "/");
}

/** 受講期限の表示。null は無期限 */
export function expiryLabel(expiresAt: string | null): string {
  return expiresAt === null ? "無期限" : `${adminDate(expiresAt)} まで`;
}

export type StatusTone = "ok" | "warn" | "muted";

export type StudentStatus = { label: string; tone: StatusTone };

/**
 * 一覧に出す 1 つのバッジ。
 *
 * アカウント状態と受講権限を掛け合わせて **1 つの言葉** にする。
 * バッジを 2 つ並べると、運営が「どっちを見ればいいのか」で迷うため。
 */
export function studentStatus(input: {
  account: AccountState;
  enrollment: EnrollmentState;
}): StudentStatus {
  if (input.account === "banned") {
    return { label: "停止中", tone: "muted" };
  }
  if (input.account === "invited") {
    return input.enrollment === "enrolled"
      ? { label: "招待済み", tone: "muted" }
      : { label: "招待済み・権限未設定", tone: "warn" };
  }
  if (input.enrollment === "enrolled") {
    return { label: "受講中", tone: "ok" };
  }
  if (input.enrollment === "expired") {
    return { label: "期限切れ", tone: "warn" };
  }
  return { label: "権限未設定", tone: "warn" };
}

/** 完了本数 / 総本数 → 「4 / 18 本（22%）」 */
export function progressLabel(completed: number, total: number): string {
  if (total === 0) return "—";
  const percent = Math.round((completed / total) * 100);
  return `${completed} / ${total} 本（${percent}%）`;
}
