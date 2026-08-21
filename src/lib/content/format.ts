import type { Level } from "@/lib/types";

/**
 * データに依存しない純粋なフォーマッタ。
 * Server / Client どちらからも普通に import してよい。
 */

/** 秒 → "12:45" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 通し番号 → "05" */
export function formatLessonNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/** コンテンツのタグに出る表記（初心者向け / 中級者向け / 上級者向け） */
export function levelLabel(level: Level): string {
  return { beginner: "初心者向け", intermediate: "中級者向け", advanced: "上級者向け" }[level];
}

/** 絞り込みフィルターに出る短い表記（初心者 / 中級 / 上級） */
export function levelFilterLabel(level: Level): string {
  return { beginner: "初心者", intermediate: "中級", advanced: "上級" }[level];
}

export const levelFilterOrder: Level[] = ["beginner", "intermediate", "advanced"];

/** 分秒指定を秒へ（シードデータ定義を読みやすくするためのヘルパー） */
export function ms(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}

/* ------------------------------------------------------------------ *
 * 日付・時刻（すべて日本時間で解釈する）
 *
 * Supabase は UTC で保存し、Vercel のサーバーも UTC で動く。
 * タイムゾーンを指定せずに日付へ落とすと、日本時間の朝 9 時より前の視聴が
 * 前日扱いになり「今日」「連続学習日数」がずれる。
 * 暦日に関わる変換は必ずここを通し、Asia/Tokyo を明示する。
 * ------------------------------------------------------------------ */

const JST = "Asia/Tokyo";
const DAY_MS = 86_400_000;

/** 日本時間の暦日キー "2026-08-21"。日付の比較・グループ化はこの文字列で行う */
export function jstDateKey(date: Date): string {
  // en-CA は "YYYY-MM-DD" を返すロケール
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 日本時間の曜日 "水" */
function jstWeekday(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: JST, weekday: "short" }).format(date);
}

/** "2026年8月19日（水）"。TOP の基準日ラベル */
export function jstTodayLabel(date: Date): string {
  const [year, month, day] = jstDateKey(date).split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日（${jstWeekday(date)}）`;
}

/** "14:20"。学習履歴の視聴時刻 */
export function jstTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** 学習履歴の日付見出し。"今日" / "昨日" / "2026/08/17（日）" */
export function jstDateGroupLabel(date: Date, now: Date): string {
  const key = jstDateKey(date);
  if (key === jstDateKey(now)) return "今日";
  if (key === jstDateKey(new Date(now.getTime() - DAY_MS))) return "昨日";
  return `${key.replace(/-/g, "/")}（${jstWeekday(date)}）`;
}

/**
 * 暦日キーの前日を返す（"2026-08-21" → "2026-08-20"）。
 * JST は夏時間を持たないので、正午を基準に 1 日戻せば必ず前日になる。
 */
function previousDateKey(key: string): string {
  const noon = new Date(`${key}T12:00:00+09:00`);
  return jstDateKey(new Date(noon.getTime() - DAY_MS));
}

/**
 * 暦日キーの並びから、基準日を起点に連続している日数を数える。
 *
 * 最新の学習日が今日でも昨日でもなければ 0（連続が途切れている）。
 * 「今日はまだ学習していないが昨日まで続いている」場合を途切れ扱いにしないため、
 * 昨日始まりも認める。
 */
export function countStreakDays(dateKeys: Iterable<string>, now: Date): number {
  const unique = [...new Set(dateKeys)].sort().reverse();
  if (unique.length === 0) return 0;

  const todayKey = jstDateKey(now);
  const yesterdayKey = jstDateKey(new Date(now.getTime() - DAY_MS));
  if (unique[0] !== todayKey && unique[0] !== yesterdayKey) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] !== previousDateKey(unique[i - 1])) break;
    streak++;
  }
  return streak;
}

/** 秒 → "14時間20分"（1 時間未満は "45分"） */
export function formatWatchTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
}
