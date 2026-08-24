"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { setLessonPublished, updateLessonFields } from "@/lib/admin/lesson-actions";
import { levelLabel } from "@/lib/content/format";
import type { AdminLesson } from "@/lib/admin/lessons";
import type { Level } from "@/lib/types";

/**
 * レッスンの内容編集。
 *
 * 動画の差し替えとは別のカードにしている。
 * 文言の直しは頻度が高く、動画に触れずに済ませたいため。
 *
 * ■ 公開切替をここに置く理由
 *   7-E では動画カードの中に置いていたが、そこは
 *   **動画があるレッスンでしか描画されない**。
 *   その結果、動画を持たないレッスン（テキスト教材や、まだ動画を入れていない
 *   89 本）は管理画面から公開状態を変えられなかった。
 *   公開はレッスンの属性なので、レッスンの編集側に置く。
 */
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

export function LessonFieldsForm({
  lesson,
  description,
  keyPoints,
  tool,
  category,
  level,
}: {
  lesson: AdminLesson;
  description: string;
  keyPoints: string[];
  tool: string;
  category: string;
  level: Level;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "ng"; text: string } | null>(null);

  const [title, setTitle] = useState(lesson.title);
  const [desc, setDesc] = useState(description);
  const [points, setPoints] = useState(keyPoints.join("\n"));
  const [chosenLevel, setChosenLevel] = useState<Level>(level);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLessonFields(lesson.slug, {
        title,
        description: desc,
        keyPoints: points.split("\n"),
        tool: tool as never,
        category: category as never,
        level: chosenLevel,
      });
      setMessage(
        result.ok
          ? { tone: "ok", text: "保存しました。" }
          : { tone: "ng", text: result.message },
      );
      if (result.ok) router.refresh();
    });
  }

  function togglePublished() {
    setMessage(null);
    startTransition(async () => {
      const result = await setLessonPublished(lesson.slug, !lesson.isPublished);
      if (!result.ok) setMessage({ tone: "ng", text: result.message });
      router.refresh();
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
        <h2 className="font-rounded text-16 font-bold text-ink">レッスンの内容</h2>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-13 text-ink3">
            {lesson.isPublished ? "公開中" : "下書き"}
          </span>
          <Button
            variant={lesson.isPublished ? "danger" : "primary"}
            size={38}
            onClick={togglePublished}
          >
            {lesson.isPublished ? "下書きに戻す" : "公開する"}
          </Button>
        </div>
      </div>

      {message && (
        <p
          className={
            message.tone === "ok"
              ? "border-b border-success-line bg-success-bg px-6 py-3 text-13 text-success"
              : "border-b border-danger-line bg-pink-bg px-6 py-3 text-13 text-danger"
          }
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-col gap-5 px-6 py-5">
        <label className="block">
          <span className="block text-125 text-ink4">タイトル</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-4 text-15 text-ink outline-none focus:border-brand-tint2"
          />
        </label>

        <label className="block">
          <span className="block text-125 text-ink4">説明</span>
          <span className="mt-0.5 block text-115 text-ink4">
            動画一覧のカードと「この動画について」に出ます
          </span>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-14 leading-[1.9] text-ink outline-none focus:border-brand-tint2"
          />
        </label>

        <label className="block">
          <span className="block text-125 text-ink4">学べること</span>
          <span className="mt-0.5 block text-115 text-ink4">1 行に 1 項目</span>
          <textarea
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-14 leading-[1.9] text-ink outline-none focus:border-brand-tint2"
          />
        </label>

        <div>
          <span className="block text-125 text-ink4">レベル</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <label
                key={l}
                className={
                  chosenLevel === l
                    ? "cursor-pointer rounded-full bg-brand-tint px-4 py-2 font-rounded text-13 font-bold text-brand-deep"
                    : "cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-13 text-ink2 hover:bg-brand-tint"
                }
              >
                <input
                  type="radio"
                  name="level"
                  className="sr-only"
                  checked={chosenLevel === l}
                  onChange={() => setChosenLevel(l)}
                />
                {levelLabel(l)}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Button size={46} onClick={save}>
            {pending ? "保存中…" : "保存する"}
          </Button>
        </div>
      </div>
    </section>
  );
}
