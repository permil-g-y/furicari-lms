"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EXPIRY_PRESETS } from "@/lib/admin/expiry";
import { inviteStudent } from "@/lib/admin/invite-actions";
import type { AdminCourse } from "@/lib/admin/students";

/**
 * 受講生の招待。
 *
 * 招待とコース付与を **同じ画面で** 行う。
 * 別作業にすると必ず付与漏れが起き、「ログインできたのに何も見られない」
 * という一番困る問い合わせになる。
 */
export function InviteForm({ courses }: { courses: readonly AdminCourse[] }) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [preset, setPreset] = useState("unlimited");
  const [customDate, setCustomDate] = useState("");
  const [result, setResult] = useState<
    { tone: "success" | "warning" | "error"; message: string; userId?: string } | null
  >(null);

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const response = await inviteStudent({
        email,
        courseSlugs: selected,
        preset,
        customDate,
      });

      if (!response.ok) {
        setResult({ tone: "error", message: response.message });
        return;
      }

      setResult({ tone: response.tone, message: response.message, userId: response.userId });
      // 成功したら入力を空にする。同じ人へ二重に送るのを防ぐ。
      setEmail("");
      setSelected([]);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {result && (
        <div
          className={
            result.tone === "success"
              ? "rounded-2xl border border-success-line bg-success-bg px-6 py-4 text-14 text-success"
              : "rounded-2xl border border-danger-line bg-pink-bg px-6 py-4 text-14 text-danger"
          }
        >
          <p>{result.message}</p>
          {result.userId && (
            <p className="mt-2">
              <Link
                href={`/admin/students/${result.userId}`}
                className="font-bold underline"
              >
                この受講生の詳細を開く
              </Link>
            </p>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-line bg-surface px-6 py-5">
        <label className="block">
          <span className="block text-125 text-ink4">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@example.com"
            autoComplete="off"
            className="mt-2 h-12 w-full max-w-[420px] rounded-xl border border-line bg-surface px-4 text-15 text-ink outline-none transition-colors placeholder:text-ink4 focus:border-brand-tint2"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-125 text-ink4">受講コース</legend>
          <div className="mt-2 flex flex-col gap-1">
            {courses.map((course) => {
              const on = selected.includes(course.id);
              return (
                <label
                  key={course.id}
                  className={
                    on
                      ? "flex cursor-pointer items-center gap-3 rounded-xl bg-brand-tint px-4 py-3 text-14 font-medium text-brand-deep"
                      : "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-14 text-ink2 transition-colors hover:bg-surface-subtle"
                  }
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(course.id)}
                    className="h-4 w-4 accent-brand"
                  />
                  {course.title}
                  <span className="ml-auto text-125 text-ink4">{course.lessonCount} 本</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-125 text-ink4">受講期限</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {EXPIRY_PRESETS.map((item) => (
              <PresetChip
                key={item.key}
                label={item.label}
                on={preset === item.key}
                onSelect={() => setPreset(item.key)}
              />
            ))}
            <PresetChip
              label="日付を指定"
              on={preset === "custom"}
              onSelect={() => setPreset("custom")}
            />
            {preset === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(event) => setCustomDate(event.target.value)}
                className="h-10 rounded-xl border border-line bg-surface px-3 text-13 text-ink outline-none focus:border-brand-tint2"
              />
            )}
          </div>
          <p className="mt-2 text-115 text-ink4">
            指定した日は、日本時間のその日いっぱいまで有効です。
          </p>
        </fieldset>

        <div className="mt-7">
          <Button size={48} onClick={submit}>
            {pending ? "送信中…" : "招待メールを送る"}
          </Button>
        </div>

        <p className="mt-3 text-115 text-ink4">
          受講権限を選ばずに招待すると、ログインできても動画を再生できません。
        </p>
      </section>
    </div>
  );
}

function PresetChip({
  label,
  on,
  onSelect,
}: {
  label: string;
  on: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={
        on
          ? "cursor-pointer rounded-full bg-brand-tint px-4 py-2 font-rounded text-13 font-bold text-brand-deep"
          : "cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-13 text-ink2 hover:bg-brand-tint"
      }
    >
      <input type="radio" name="preset" className="sr-only" checked={on} onChange={onSelect} />
      {label}
    </label>
  );
}
