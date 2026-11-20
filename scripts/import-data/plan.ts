/**
 * スプレッドシートと Google Drive から「インポート計画」を組み立てる。
 *
 * ■ ここでは DB にも Cloudflare にも一切触らない
 *   取り込み元の解釈と照合だけを担当し、結果を純粋なデータとして返す。
 *   こうしておくと Dry Run と本番実行がまったく同じ計画を見ることになり、
 *   「Dry Run では通ったのに本番では違うものが入った」が起きない。
 *
 * ■ 推測で埋めない
 *   列が想定と違う・管理番号が重複する・Chapter が定義に無い等は
 *   すべて致命的エラーとして扱い、呼び出し側を止める。
 */

export type CourseConfig = {
  spreadsheetId: string;
  /** タブ指定。null なら先頭シート */
  gid: string | null;
  course: {
    slug: string;
    title: string;
    description: string;
  };
  /** 表示順そのもの。index + 1 が Chapter 番号になる */
  chapters: string[];
};

export type PlannedLesson = {
  /** 「2-1-1」。シートと Drive を結ぶ唯一の鍵 */
  code: string;
  chapterNumber: number;
  chapterTitle: string;
  /** コース内通し番号 */
  number: number;
  title: string;
  description: string;
  /** シート C 列。階層にはしないが照合の手掛かりとして残す */
  lessonGroup: string;
  driveFileId: string | null;
  driveFileName: string | null;
};

export type Plan = {
  lessons: PlannedLesson[];
  /** 動画が見つからなかった管理番号（Chapter 1 の未納品が該当する想定） */
  missingVideos: string[];
  /** シートに対応行が無い Drive ファイル */
  orphanVideos: { code: string; driveFileName: string }[];
  /** シートと Drive でタイトル表記が違うもの。番号一致なので採用するが報告する */
  titleMismatches: { code: string; sheetTitle: string; driveFileName: string }[];
};

const EXPECTED_HEADER = [
  "Course",
  "Chapter【セクション】",
  "Lesson",
  "解説動画",
  "解説内容",
];

/** RFC4180 の最小限のパーサ。引用符内の改行とカンマを正しく扱う。 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export async function fetchSheetCsv(config: CourseConfig): Promise<string[][]> {
  const base = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv`;
  const url = config.gid ? `${base}&gid=${config.gid}` : base;

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(
      `スプレッドシートを取得できませんでした（HTTP ${response.status}）。共有設定を確認してください。`,
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/csv")) {
    throw new Error(
      `CSV が返りませんでした（content-type: ${contentType}）。リンク共有が切れている可能性があります。`,
    );
  }

  const rows = parseCsv(await response.text());
  if (rows.length === 0) throw new Error("シートが空でした。");

  // 列位置を決め打ちしないための検証。ズレたまま登録するより止める。
  const header = rows[0].map((h) => h.trim());
  for (let i = 0; i < EXPECTED_HEADER.length; i++) {
    if (header[i] !== EXPECTED_HEADER[i]) {
      throw new Error(
        `シートの列構成が想定と違います。${i + 1} 列目は "${EXPECTED_HEADER[i]}" のはずですが "${header[i] ?? ""}" でした。`,
      );
    }
  }
  return rows.slice(1);
}

/** 「2-1-1.タイトル」「4-1-1タイトル」どちらからも番号を取り出す */
export function extractCode(title: string): string | null {
  const match = title.trim().match(/^(\d+)-(\d+)-(\d+)/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function buildPlan(
  rows: string[][],
  driveFiles: { code: string; driveFileId: string; driveFileName: string }[],
  config: CourseConfig,
): Plan {
  const chapterNumberByTitle = new Map<string, number>();
  config.chapters.forEach((title, index) => chapterNumberByTitle.set(title, index + 1));

  const driveByCode = new Map(driveFiles.map((f) => [f.code, f]));
  const usedDriveCodes = new Set<string>();

  const lessons: PlannedLesson[] = [];
  const seenCodes = new Set<string>();
  const titleMismatches: Plan["titleMismatches"] = [];

  for (const row of rows) {
    const chapterCell = (row[1] ?? "").trim();
    const lessonGroup = (row[2] ?? "").trim();
    const title = (row[3] ?? "").trim();
    const description = (row[4] ?? "").trim();
    if (!chapterCell || !title) continue;

    const code = extractCode(title);
    if (!code) {
      throw new Error(`管理番号を読み取れない行があります: "${title}"`);
    }
    if (seenCodes.has(code)) {
      throw new Error(`管理番号が重複しています: ${code}`);
    }
    seenCodes.add(code);

    // シート B 列は「1.AIで動画編集はどう変わるのか」。設定側は番号なしで持つ。
    const chapterTitle = chapterCell.replace(/^\d+\s*[.．]\s*/, "");
    const chapterNumber = chapterNumberByTitle.get(chapterTitle);
    if (chapterNumber === undefined) {
      throw new Error(
        `設定に無い Chapter がシートにあります: "${chapterTitle}"（元の値 "${chapterCell}"）`,
      );
    }
    // 管理番号の先頭と Chapter 番号が食い違うのは、どちらかが間違っている。
    const codeChapter = Number(code.split("-")[0]);
    if (codeChapter !== chapterNumber) {
      throw new Error(
        `管理番号 ${code} と Chapter ${chapterNumber}（${chapterTitle}）が一致しません。`,
      );
    }

    const drive = driveByCode.get(code) ?? null;
    if (drive) {
      usedDriveCodes.add(code);
      // macOS 由来のファイル名は濁点が分解された NFD で届く。
      // 正規化せずに比べると、見た目が同じ文字列を「表記ゆれ」と誤検出し、
      // 本物の表記ゆれ（5-1-1）が埋もれる。
      const driveTitle = drive.driveFileName.replace(/\.mp4$/i, "").normalize("NFC");
      if (driveTitle !== title.normalize("NFC")) {
        titleMismatches.push({ code, sheetTitle: title, driveFileName: drive.driveFileName });
      }
    }

    lessons.push({
      code,
      chapterNumber,
      chapterTitle,
      number: lessons.length + 1,
      title,
      description,
      lessonGroup,
      driveFileId: drive?.driveFileId ?? null,
      driveFileName: drive?.driveFileName ?? null,
    });
  }

  lessons.sort((a, b) => {
    const pa = a.code.split("-").map(Number);
    const pb = b.code.split("-").map(Number);
    return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
  });
  lessons.forEach((lesson, index) => { lesson.number = index + 1; });

  return {
    lessons,
    missingVideos: lessons.filter((l) => !l.driveFileId).map((l) => l.code),
    orphanVideos: driveFiles
      .filter((f) => !usedDriveCodes.has(f.code))
      .map((f) => ({ code: f.code, driveFileName: f.driveFileName })),
    titleMismatches,
  };
}
