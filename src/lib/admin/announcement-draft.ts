import type { AnnouncementBlock, AnnouncementCategory } from "@/lib/types";

/**
 * お知らせの下書きを組み立てるロジック。
 *
 * ■ リッチテキストエディタは作らない
 *   本文は Phase 6 で決めた `AnnouncementBlock[]` をそのまま持つ。
 *   WYSIWYG を入れると型が崩れ、一覧・詳細・TOP の描画を作り直すことになる。
 *   運営がやりたいのは「見出し・段落・箇条書きを並べる」だけなので、
 *   ブロックを足して並べ替えるだけの最小の編集にする。
 *
 * ここは純粋関数だけ。並べ替えや削除で本文が壊れないことをテストで固定する。
 */

export type DraftBlock = AnnouncementBlock;

export const BLOCK_LABELS: Record<DraftBlock["type"], string> = {
  heading: "見出し",
  paragraph: "段落",
  callout: "箇条書き",
};

export function emptyBlock(type: DraftBlock["type"]): DraftBlock {
  if (type === "callout") return { type: "callout", title: "", items: [""] };
  return { type, text: "" };
}

export function moveBlock(
  blocks: readonly DraftBlock[],
  index: number,
  direction: -1 | 1,
): DraftBlock[] {
  const target = index + direction;
  if (index < 0 || index >= blocks.length) return [...blocks];
  if (target < 0 || target >= blocks.length) return [...blocks];
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeBlock(blocks: readonly DraftBlock[], index: number): DraftBlock[] {
  if (index < 0 || index >= blocks.length) return [...blocks];
  return blocks.filter((_, i) => i !== index);
}

/**
 * 保存前の掃除。
 *
 * 空のブロックは保存しない。運営が「段落」を足したまま書かずに保存すると、
 * 受講生の画面に空白が出るため。
 */
export function cleanBlocks(blocks: readonly DraftBlock[]): DraftBlock[] {
  const cleaned: DraftBlock[] = [];
  for (const block of blocks) {
    if (block.type === "callout") {
      const items = block.items.map((i) => i.trim()).filter(Boolean);
      const title = block.title.trim();
      if (items.length === 0 && !title) continue;
      cleaned.push({ type: "callout", title, items });
      continue;
    }
    const text = block.text.trim();
    if (!text) continue;
    cleaned.push({ type: block.type, text });
  }
  return cleaned;
}

export type DraftInput = {
  slug: string;
  title: string;
  category: AnnouncementCategory;
  /** 「YYYY-MM-DD」＋「HH:MM」。JST として解釈する */
  publishDate: string;
  publishTime: string;
  isPublished: boolean;
  blocks: readonly DraftBlock[];
};

export type ValidDraft = {
  slug: string;
  title: string;
  category: AnnouncementCategory;
  publishedAt: string;
  isPublished: boolean;
  body: DraftBlock[];
};

/** slug に使える形（URL に出るため） */
const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * 公開日時は **JST として解釈する**。
 * Supabase も Vercel も UTC で動いているため、素直に new Date すると
 * 運営が指定した日時と 9 時間ずれる。
 */
export function toJstTimestamp(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const hhmm = time.trim() || "00:00";
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const iso = `${date}T${hhmm}:00+09:00`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

export function validateDraft(
  input: DraftInput,
): { ok: true; draft: ValidDraft } | { ok: false; message: string } {
  const slug = input.slug.trim().toLowerCase();
  if (!slug) return { ok: false, message: "URL 用の ID を入力してください。" };
  if (!SLUG_SHAPE.test(slug)) {
    return {
      ok: false,
      message: "URL 用の ID は半角英数字とハイフンだけで入力してください。",
    };
  }

  const title = input.title.trim();
  if (!title) return { ok: false, message: "タイトルを入力してください。" };

  const publishedAt = toJstTimestamp(input.publishDate, input.publishTime);
  if (!publishedAt) return { ok: false, message: "公開日時の形式が正しくありません。" };

  const body = cleanBlocks(input.blocks);

  // 公開するなら本文が要る。空のお知らせを受講生へ出さない
  if (input.isPublished && body.length === 0) {
    return { ok: false, message: "公開するには本文を 1 つ以上入力してください。" };
  }

  return {
    ok: true,
    draft: { slug, title, category: input.category, publishedAt, isPublished: input.isPublished, body },
  };
}

/** 一覧に出す状態 */
export type AnnouncementState = "published" | "scheduled" | "draft";

export function announcementState(
  row: { isPublished: boolean; publishedAt: string },
  now: Date = new Date(),
): AnnouncementState {
  if (!row.isPublished) return "draft";
  return Date.parse(row.publishedAt) > now.getTime() ? "scheduled" : "published";
}

export const STATE_LABELS: Record<AnnouncementState, string> = {
  published: "公開中",
  scheduled: "公開予定",
  draft: "下書き",
};
