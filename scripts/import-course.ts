/**
 * 教材一括インポート。
 *
 *   npx tsx --conditions=react-server scripts/import-course.ts <config.json> [--upload]
 *
 * ■ 何をするか
 *   1. Google スプレッドシートから教材一覧を取得する
 *   2. Google Drive の動画ファイルと管理番号で照合する
 *   3. --upload が付いていれば、未アップロードの動画だけ Cloudflare Stream へ送る
 *   4. Cloudflare から実尺と処理状態を取得する
 *   5. 投入用 SQL を書き出す（冪等な upsert）
 *
 * ■ なぜ DB へ直接書かないのか
 *   このプロジェクトは service_role にテーブル権限を与えていない（migration が
 *   authenticated にしか grant していない）。既存コンテンツも SQL Editor で
 *   投入されており、その作法に合わせる。権限設計を緩めるより安全。
 *
 * ■ 途中再開
 *   アップロード結果は 1 本ごとに ledger.json へ保存する。
 *   再実行すると uid を持つものは飛ばすので、二重アップロードが起きない。
 *   Cloudflare の uid は Direct Creator Upload の発行時点で確定するため、
 *   「送ったが uid が分からない」状態にならない。
 *
 * ■ 既存データを壊さない
 *   書き出す SQL は slug を鍵にした upsert のみ。delete は一切含めない。
 *   他コースにも、受講生の進捗にも触れない。
 */

import { readFileSync, writeFileSync, existsSync, statSync, openAsBlob, unlinkSync } from "node:fs";
import { createDirectUpload, fetchVideoState } from "../src/lib/stream/api";
import { fetchSheetCsv, buildPlan, type CourseConfig, type PlannedLesson } from "./import-data/plan";

type Config = CourseConfig & {
  driveFolderId: string;
  course: CourseConfig["course"] & {
    level: string;
    categorySlug: string;
    coverBgColor: string;
    coverIcon: string;
    sortOrder: number;
    publishedOn: string;
  };
  toolRules: { match: string; toolSlug: string }[];
  defaultToolSlug: string;
};

type LedgerEntry = {
  code: string;
  driveFileId: string;
  driveFileName: string;
  /** Cloudflare Stream の Video UID */
  uid: string;
  uploadedAt: string;
  durationSeconds: number | null;
  state: "pending" | "ready" | "error";
  error?: string;
};

const LEDGER_PATH = "scripts/import-data/ledger.json";
const VIDEO_DIR = process.env.IMPORT_VIDEO_DIR ?? "";

function loadLedger(): Record<string, LedgerEntry> {
  if (!existsSync(LEDGER_PATH)) return {};
  return JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as Record<string, LedgerEntry>;
}

function saveLedger(ledger: Record<string, LedgerEntry>): void {
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n");
}

/** SQL 文字列リテラル。seed ジェネレータと同じ作法。 */
function q(value: string | null): string {
  if (value === null) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

/** タイトルと説明から使用ツールを決める。推測を散らさず 1 箇所に閉じ込める。 */
function resolveToolSlug(lesson: PlannedLesson, config: Config): string {
  const haystack = `${lesson.title} ${lesson.description}`;
  for (const rule of config.toolRules) {
    if (haystack.includes(rule.match)) return rule.toolSlug;
  }
  return config.defaultToolSlug;
}

function lessonSlug(config: Config, lesson: PlannedLesson): string {
  return `${config.course.slug}-${String(lesson.number).padStart(2, "0")}`;
}

function chapterSlug(config: Config, chapterNumber: number): string {
  return `${config.course.slug}-ch${chapterNumber}`;
}

async function uploadOne(
  lesson: PlannedLesson,
  config: Config,
  ledger: Record<string, LedgerEntry>,
): Promise<void> {
  const path = `${VIDEO_DIR}/${lesson.code}.mp4`;
  if (!existsSync(path)) {
    throw new Error(
      `動画ファイルがありません: ${path}\n  先に scripts/import-data/download-drive.sh を実行してください。`,
    );
  }
  const size = statSync(path).size;

  // uid はここで確定する。POST が失敗しても ledger には残さないので、
  // 再実行時は新しい uid を取り直す（孤児は Cloudflare 側に残るが DB には入らない）。
  const upload = await createDirectUpload({
    lessonSlug: lessonSlug(config, lesson),
    lessonTitle: lesson.title,
  });

  const form = new FormData();
  form.append("file", await openAsBlob(path), `${lesson.code}.mp4`);

  const response = await fetch(upload.uploadUrl, { method: "POST", body: form });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`アップロードに失敗しました（HTTP ${response.status}）: ${detail}`);
  }

  ledger[lesson.code] = {
    code: lesson.code,
    driveFileId: lesson.driveFileId!,
    driveFileName: lesson.driveFileName!,
    uid: upload.uid,
    uploadedAt: new Date().toISOString(),
    durationSeconds: null,
    state: "pending",
  };
  saveLedger(ledger);
  console.log(`  ✓ ${lesson.code} アップロード完了 (${(size / 1024 / 1024).toFixed(0)}MB)`);
}

async function syncStates(ledger: Record<string, LedgerEntry>): Promise<void> {
  const pending = Object.values(ledger).filter((e) => e.state !== "ready");
  if (pending.length === 0) return;

  console.log(`\n■ Cloudflare の処理状態を確認（${pending.length} 本）`);
  for (const entry of pending) {
    try {
      const state = await fetchVideoState(entry.uid);
      entry.state = state.status;
      entry.durationSeconds = state.durationSeconds ?? null;
      if (state.status === "error") entry.error = state.error ?? "不明なエラー";
      const label =
        state.status === "ready"
          ? `ready (${state.durationSeconds}s)`
          : state.status === "error"
            ? `error: ${entry.error}`
            : `pending ${state.percent ?? 0}%`;
      console.log(`  ${entry.code}: ${label}`);
    } catch (error) {
      console.log(`  ${entry.code}: 状態取得に失敗 (${(error as Error).message})`);
    }
  }
  saveLedger(ledger);
}

function buildSql(
  plan: { lessons: PlannedLesson[] },
  config: Config,
  ledger: Record<string, LedgerEntry>,
): string {
  const c = config.course;
  const courseRef = `(select id from public.courses where slug = ${q(c.slug)})`;
  const categoryRef = `(select id from public.categories where slug = ${q(c.categorySlug)})`;

  const out: string[] = [];
  out.push("-- !! このファイルは scripts/import-course.ts が生成します。直接編集しないでください。!!");
  out.push(`-- 生成元: スプレッドシート ${config.spreadsheetId} / Drive ${config.driveFolderId}`);
  out.push("--");
  out.push("-- slug を鍵にした upsert のみ。delete は含まない。");
  out.push("-- 既存の他コース・受講生の進捗には一切触れない。");
  out.push("");
  out.push("begin;");
  out.push("");

  out.push("-- コース");
  out.push(`insert into public.courses
  (slug, title, description, category_id, level, cover_bg_color, cover_icon, duration_label, is_published, sort_order)
values
  (${q(c.slug)}, ${q(c.title)}, ${q(c.description)}, ${categoryRef}, ${q(c.level)}::public.content_level,
   ${q(c.coverBgColor)}, ${q(c.coverIcon)}, ${q(courseDurationLabel(plan, ledger))}, true, ${c.sortOrder})
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  duration_label = excluded.duration_label,
  sort_order = excluded.sort_order,
  updated_at = now();`);
  out.push("");

  out.push("-- チャプター");
  config.chapters.forEach((title, index) => {
    const number = index + 1;
    out.push(`insert into public.chapters (course_id, slug, number, title, sort_order)
values (${courseRef}, ${q(chapterSlug(config, number))}, ${number}, ${q(title)}, ${number})
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();`);
  });
  out.push("");

  out.push("-- レッスン");
  for (const lesson of plan.lessons) {
    const entry = ledger[lesson.code];
    const uid = entry?.state === "ready" ? entry.uid : null;
    const duration = entry?.state === "ready" ? (entry.durationSeconds ?? 0) : 0;
    const streamStatus = entry ? `${q(entry.state)}::public.stream_status` : "null";
    const toolRef = `(select id from public.tools where slug = ${q(resolveToolSlug(lesson, config))})`;

    out.push(`-- [${lesson.code}] ${lesson.driveFileId ? "動画あり" : "動画なし（未納品）"}`);
    out.push(`insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  (${q(lessonSlug(config, lesson))}, ${courseRef},
   (select id from public.chapters where slug = ${q(chapterSlug(config, lesson.chapterNumber))}),
   ${lesson.number}, ${q(lesson.title)}, ${q(lesson.description || null)},
   ${uid ? q(uid) : "null"}, ${duration},
   ${toolRef}, ${categoryRef}, ${q(c.level)}::public.content_level,
   true, ${q(`${c.publishedOn}T00:00:00+09:00`)}, ${lesson.number}, ${streamStatus})
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();`);
  }

  out.push("");
  out.push("commit;");
  out.push("");
  return out.join("\n");
}

/** 既存コースに合わせた「約N時間」ラベル。実尺の合計から出す（捏造しない）。 */
function courseDurationLabel(
  plan: { lessons: PlannedLesson[] },
  ledger: Record<string, LedgerEntry>,
): string {
  const total = Object.values(ledger)
    .filter((e) => e.state === "ready")
    .reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);
  if (total === 0) return "";
  const minutes = Math.round(total / 60);
  return minutes < 60 ? `約${minutes}分` : `約${Math.round(minutes / 60)}時間`;
}

async function main() {
  const configPath = process.argv[2];
  const doUpload = process.argv.includes("--upload");
  if (!configPath) {
    console.error("使い方: tsx --conditions=react-server scripts/import-course.ts <config.json> [--upload]");
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, "utf8")) as Config;
  const driveFiles = JSON.parse(readFileSync("scripts/import-data/drive-files.json", "utf8"));
  const rows = await fetchSheetCsv(config);
  const plan = buildPlan(rows, driveFiles, config);
  const ledger = loadLedger();

  console.log(`\n=== ${config.course.title} ===`);
  console.log(`Chapter ${config.chapters.length} / Lesson ${plan.lessons.length}`);
  console.log(`動画あり ${plan.lessons.filter((l) => l.driveFileId).length} / 動画なし ${plan.missingVideos.length}`);

  if (plan.orphanVideos.length > 0) {
    console.error("\n! シートに対応行の無い動画があります。推測で登録しません:");
    for (const o of plan.orphanVideos) console.error(`    ${o.code} ${o.driveFileName}`);
    process.exit(1);
  }
  if (plan.titleMismatches.length > 0) {
    console.log("\n■ シートと Drive でファイル名が違うもの（管理番号一致のため採用。表示名はシートを優先）");
    for (const m of plan.titleMismatches) {
      if (m.sheetTitle !== m.driveFileName.replace(/\.mp4$/i, "")) {
        console.log(`    [${m.code}] シート: ${m.sheetTitle}`);
        console.log(`             Drive : ${m.driveFileName}`);
      }
    }
  }

  if (doUpload) {
    if (!VIDEO_DIR) throw new Error("IMPORT_VIDEO_DIR を指定してください。");
    const targets = plan.lessons.filter((l) => l.driveFileId && !ledger[l.code]);
    console.log(`\n■ アップロード対象 ${targets.length} 本（済み ${Object.keys(ledger).length} 本は飛ばす）`);
    for (const lesson of targets) {
      try {
        await uploadOne(lesson, config, ledger);
      } catch (error) {
        console.error(`  × ${lesson.code} 失敗: ${(error as Error).message}`);
      }
    }
    await syncStates(ledger);
  } else {
    await syncStates(ledger);
  }

  const sqlPath = `supabase/seed/0003_${config.course.slug.replace(/-/g, "_")}.sql`;
  writeFileSync(sqlPath, buildSql(plan, config, ledger));
  console.log(`\n■ 投入用 SQL を書き出しました: ${sqlPath}`);

  const ready = Object.values(ledger).filter((e) => e.state === "ready").length;
  const pending = Object.values(ledger).filter((e) => e.state === "pending").length;
  const failed = Object.values(ledger).filter((e) => e.state === "error").length;
  console.log(`\n=== 集計 ===`);
  console.log(`  Lesson 登録予定 : ${plan.lessons.length}`);
  console.log(`  動画 ready      : ${ready}`);
  console.log(`  動画 変換中     : ${pending}`);
  console.log(`  動画 エラー     : ${failed}`);
  console.log(`  動画なし(未納品): ${plan.missingVideos.length}  [${plan.missingVideos.join(", ")}]`);
}

main().catch((error) => {
  console.error("\nERROR:", (error as Error).message);
  process.exit(1);
});
