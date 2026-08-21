/**
 * 受講期限の計算。
 *
 * ■ なぜ「その日の終わり」まで有効にするのか
 *   運営が「2026/12/31 まで」と設定したとき、受講生の感覚は
 *   「12/31 いっぱいは見られる」である。
 *   素直に 2026-12-31T00:00:00Z を入れると JST では 12/31 の午前 9 時に切れ、
 *   その日の午後から見られなくなる。必ず **JST の 23:59:59** に寄せる。
 *
 * ■ なぜ月数の加算を自前でやるのか
 *   Date の setMonth は UTC 基準で動くため、JST の月末付近で 1 日ずれる。
 *   ここは表示ではなく課金に直結するので、JST のカレンダー上で計算する。
 */

export const EXPIRY_PRESETS = [
  { key: "unlimited", label: "無期限", months: null },
  { key: "3m", label: "3ヶ月", months: 3 },
  { key: "6m", label: "6ヶ月", months: 6 },
  { key: "12m", label: "1年", months: 12 },
] as const;

export type ExpiryPresetKey = (typeof EXPIRY_PRESETS)[number]["key"] | "custom";

/** JST における年・月・日 */
function jstParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, day] = parts.split("-").map(Number);
  return { year, month, day };
}

/** その月の日数（1-12 月） */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 「YYYY-MM-DD」→ JST のその日の終わりを表す ISO 文字列 */
export function endOfJstDay(dateInput: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return `${y}-${m}-${d}T23:59:59+09:00`;
}

/**
 * 現在から N ヶ月後の、JST におけるその日の終わり。
 * 月末は繰り上がらないよう丸める（1/31 の 1 ヶ月後は 2/28 または 2/29）。
 */
export function monthsFromNow(months: number, now: Date = new Date()): string {
  const { year, month, day } = jstParts(now);
  const total = month - 1 + months;
  const targetYear = year + Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}T23:59:59+09:00`;
}

/** フォーム入力 → DB へ入れる expires_at（null は無期限） */
export function resolveExpiry(
  preset: string,
  customDate: string,
  now: Date = new Date(),
): { expiresAt: string | null } | { error: string } {
  if (preset === "unlimited") return { expiresAt: null };

  if (preset === "custom") {
    const value = endOfJstDay(customDate);
    if (!value) return { error: "日付の形式が正しくありません。" };
    if (Date.parse(value) <= now.getTime()) {
      return { error: "過去の日付は指定できません。" };
    }
    return { expiresAt: value };
  }

  const found = EXPIRY_PRESETS.find((p) => p.key === preset);
  if (!found || found.months === null) {
    return { error: "期限の指定が正しくありません。" };
  }
  return { expiresAt: monthsFromNow(found.months, now) };
}

/** 期限切れが近いか（既定 7 日以内）。null（無期限）は常に false */
export function isExpiringSoon(
  expiresAt: string | null,
  now: Date = new Date(),
  withinDays = 7,
): boolean {
  if (expiresAt === null) return false;
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return false;
  const diff = expires - now.getTime();
  return diff > 0 && diff <= withinDays * 24 * 60 * 60 * 1000;
}
