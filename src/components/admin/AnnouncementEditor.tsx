"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { announcementCategoryLabel } from "@/lib/news/presentation";
import {
  BLOCK_LABELS,
  emptyBlock,
  moveBlock,
  removeBlock,
  type DraftBlock,
} from "@/lib/admin/announcement-draft";
import { saveAnnouncement } from "@/lib/admin/announcement-actions";
import type { AdminAnnouncement } from "@/lib/admin/announcement-server";
import type { AnnouncementCategory } from "@/lib/types";

/**
 * お知らせの編集。
 *
 * ■ リッチテキストエディタは作らない
 *   本文は Phase 6 で決めた `AnnouncementBlock[]` のまま扱う。
 *   WYSIWYG を入れると型が崩れ、受講生側の一覧・詳細・TOP の描画を
 *   作り直すことになる。運営がやりたいのは
 *   「見出し・段落・箇条書きを並べる」だけなので、それだけを提供する。
 */

const CATEGORIES: AnnouncementCategory[] = [
  "new_course",
  "event",
  "update",
  "maintenance",
];

/** ISO 日時 → JST の「YYYY-MM-DD」と「HH:MM」 */
function splitJst(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "00:00" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function AnnouncementEditor({
  announcement,
}: {
  /** null なら新規作成 */
  announcement: AdminAnnouncement | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = announcement
    ? splitJst(announcement.publishedAt)
    : splitJst(new Date().toISOString());

  const [slug, setSlug] = useState(announcement?.slug ?? "");
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(
    announcement?.category ?? "update",
  );
  const [publishDate, setPublishDate] = useState(initial.date);
  const [publishTime, setPublishTime] = useState(initial.time);
  const [blocks, setBlocks] = useState<DraftBlock[]>(announcement?.body ?? []);

  function save(isPublished: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await saveAnnouncement({
        id: announcement?.id ?? null,
        draft: { slug, title, category, publishDate, publishTime, isPublished, blocks },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/admin/announcements/${result.slug}`);
      router.refresh();
    });
  }

  function patch(index: number, next: DraftBlock) {
    setBlocks((current) => current.map((b, i) => (i === index ? next : b)));
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p className="rounded-2xl border border-danger-line bg-pink-bg px-6 py-4 text-14 text-danger">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-line bg-surface px-6 py-5">
        <Field label="タイトル">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-15 text-ink outline-none focus:border-brand-tint2"
          />
        </Field>

        <Field label="URL 用の ID" hint="受講生に見える URL に使われます（半角英数字とハイフン）">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="summer-course"
            className="h-12 w-full max-w-[360px] rounded-xl border border-line bg-surface px-4 font-mono text-14 text-ink outline-none focus:border-brand-tint2"
          />
        </Field>

        <Field label="カテゴリ">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className={
                  category === c
                    ? "cursor-pointer rounded-full bg-brand-tint px-4 py-2 font-rounded text-13 font-bold text-brand-deep"
                    : "cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-13 text-ink2 hover:bg-brand-tint"
                }
              >
                <input
                  type="radio"
                  name="category"
                  className="sr-only"
                  checked={category === c}
                  onChange={() => setCategory(c)}
                />
                {announcementCategoryLabel[c]}
              </label>
            ))}
          </div>
        </Field>

        <Field label="公開日時" hint="未来の日時にすると予約公開になります（日本時間）">
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="h-11 rounded-xl border border-line bg-surface px-3 text-14 text-ink outline-none focus:border-brand-tint2"
            />
            <input
              type="time"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
              className="h-11 rounded-xl border border-line bg-surface px-3 text-14 text-ink outline-none focus:border-brand-tint2"
            />
          </div>
        </Field>
      </section>

      <section className="rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-6 py-4 font-rounded text-16 font-bold text-ink">
          本文
        </h2>

        {blocks.length === 0 ? (
          <p className="px-6 py-5 text-14 text-ink3">
            まだ本文がありません。下のボタンから追加してください。
          </p>
        ) : (
          <ul>
            {blocks.map((block, index) => (
              <li key={index} className="border-b border-line px-6 py-4 last:border-b-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-brand-tint px-3 py-1 font-rounded text-11 font-bold text-brand-deep">
                    {BLOCK_LABELS[block.type]}
                  </span>
                  <div className="ml-auto flex gap-1.5">
                    <IconButton label="上へ" onClick={() => setBlocks(moveBlock(blocks, index, -1))} />
                    <IconButton label="下へ" onClick={() => setBlocks(moveBlock(blocks, index, 1))} />
                    <IconButton label="削除" onClick={() => setBlocks(removeBlock(blocks, index))} danger />
                  </div>
                </div>

                {block.type === "callout" ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={block.title}
                      onChange={(e) => patch(index, { ...block, title: e.target.value })}
                      placeholder="見出し（任意）"
                      className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-14 outline-none focus:border-brand-tint2"
                    />
                    <textarea
                      value={block.items.join("\n")}
                      onChange={(e) =>
                        patch(index, { ...block, items: e.target.value.split("\n") })
                      }
                      rows={3}
                      placeholder="1 行に 1 項目"
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-14 leading-[1.8] outline-none focus:border-brand-tint2"
                    />
                  </div>
                ) : block.type === "heading" ? (
                  <input
                    value={block.text}
                    onChange={(e) => patch(index, { ...block, text: e.target.value })}
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-15 font-bold outline-none focus:border-brand-tint2"
                  />
                ) : (
                  <textarea
                    value={block.text}
                    onChange={(e) => patch(index, { ...block, text: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-14 leading-[1.9] outline-none focus:border-brand-tint2"
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 border-t border-line px-6 py-4">
          {(["heading", "paragraph", "callout"] as const).map((type) => (
            <Button
              key={type}
              variant="outline"
              size={38}
              onClick={() => setBlocks([...blocks, emptyBlock(type)])}
            >
              ＋ {BLOCK_LABELS[type]}
            </Button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button size={46} onClick={() => save(true)}>
          {pending ? "保存中…" : "公開する"}
        </Button>
        <Button variant="outline" size={46} onClick={() => save(false)}>
          下書きとして保存
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <span className="block text-125 text-ink4">{label}</span>
      {hint && <span className="mt-0.5 block text-115 text-ink4">{hint}</span>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? "rounded-full border border-danger-line bg-surface px-3 py-1 text-115 text-danger transition-colors hover:bg-pink-bg"
          : "rounded-full border border-line bg-surface px-3 py-1 text-115 text-ink2 transition-colors hover:bg-brand-tint"
      }
    >
      {label}
    </button>
  );
}
