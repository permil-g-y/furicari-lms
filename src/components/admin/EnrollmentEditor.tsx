"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { StudentStatusTag } from "./StudentStatusTag";
import { expiryLabel } from "@/lib/admin/format";
import { EXPIRY_PRESETS } from "@/lib/admin/expiry";
import {
  grantEnrollment,
  revokeEnrollment,
} from "@/lib/admin/enrollment-actions";
import type { StudentEnrollment } from "@/lib/admin/students";
import type { AdminCourse } from "@/lib/admin/students";

/**
 * 受講権限の付与・解除・期限変更。
 *
 * ■ 楽観的更新をしていない理由
 *   受講権限は「見られる / 見られない」に直結する。
 *   保存できていないのに付与済みに見えるほうが、
 *   一瞬待たされるより実害が大きい。サーバーの結果を待って反映する。
 *
 * ■ 解除に確認を挟む理由
 *   誤って押すと受講生が締め出される。取り消しは付与し直せば済むが、
 *   その間に問い合わせが発生する。
 */
export function EnrollmentEditor({
  userId,
  studentName,
  courses,
  enrollments,
}: {
  userId: string;
  studentName: string;
  courses: readonly AdminCourse[];
  enrollments: readonly StudentEnrollment[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const current = new Map(enrollments.map((e) => [e.courseId, e]));

  function run(work: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (result.ok) {
        setEditing(null);
        setConfirming(null);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <h2 className="border-b border-line px-6 py-4 font-rounded text-16 font-bold text-ink">
        受講コース
      </h2>

      {error && (
        <p className="border-b border-danger-line bg-pink-bg px-6 py-3 text-13 text-danger">
          {error}
        </p>
      )}

      <ul>
        {courses.map((course) => {
          const enrollment = current.get(course.id);
          const isEditing = editing === course.id;
          const isConfirming = confirming === course.id;

          return (
            <li key={course.id} className="border-b border-line px-6 py-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="min-w-0 flex-1 text-14 text-ink">{course.title}</span>

                {enrollment ? (
                  <>
                    <span className="text-13 text-ink2 tabular-nums">
                      {expiryLabel(enrollment.expiresAt)}
                    </span>
                    <StudentStatusTag
                      label={enrollment.active ? "有効" : "期限切れ"}
                      tone={enrollment.active ? "ok" : "warn"}
                    />
                    <Button
                      variant="outline"
                      size={38}
                      onClick={() => {
                        setConfirming(null);
                        setEditing(isEditing ? null : course.id);
                      }}
                    >
                      期限を変更
                    </Button>
                    <Button
                      variant="danger"
                      size={38}
                      onClick={() => {
                        setEditing(null);
                        setConfirming(isConfirming ? null : course.id);
                      }}
                    >
                      解除
                    </Button>
                  </>
                ) : (
                  <>
                    <StudentStatusTag label="未受講" tone="muted" />
                    <Button
                      variant="outline-brand"
                      size={38}
                      onClick={() => setEditing(isEditing ? null : course.id)}
                    >
                      付与する
                    </Button>
                  </>
                )}
              </div>

              {isEditing && (
                <ExpiryForm
                  pending={pending}
                  onCancel={() => setEditing(null)}
                  onSubmit={(preset, customDate) =>
                    run(() =>
                      grantEnrollment({
                        userId,
                        courseSlug: course.id,
                        preset,
                        customDate,
                      }),
                    )
                  }
                />
              )}

              {isConfirming && (
                <div className="mt-3 rounded-xl border border-danger-line bg-pink-bg px-4 py-3">
                  <p className="text-13 text-ink-sub">
                    <strong className="font-bold">{studentName}</strong> さんの「
                    {course.title}」の受講権限を解除します。
                    解除するとこのコースの動画は再生できなくなります。
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="danger"
                      size={38}
                      onClick={() =>
                        run(() => revokeEnrollment({ userId, courseSlug: course.id }))
                      }
                    >
                      {pending ? "解除中…" : "解除する"}
                    </Button>
                    <Button variant="outline" size={38} onClick={() => setConfirming(null)}>
                      やめる
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ExpiryForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (preset: string, customDate: string) => void;
}) {
  const [preset, setPreset] = useState<string>("unlimited");
  const [customDate, setCustomDate] = useState("");

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface-subtle px-4 py-3">
      <p className="text-125 text-ink4">受講期限</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {EXPIRY_PRESETS.map((item) => (
          <label
            key={item.key}
            className={
              preset === item.key
                ? "cursor-pointer rounded-full bg-brand-tint px-4 py-2 font-rounded text-13 font-bold text-brand-deep"
                : "cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-13 text-ink2 hover:bg-brand-tint"
            }
          >
            <input
              type="radio"
              name="preset"
              className="sr-only"
              checked={preset === item.key}
              onChange={() => setPreset(item.key)}
            />
            {item.label}
          </label>
        ))}
        <label
          className={
            preset === "custom"
              ? "cursor-pointer rounded-full bg-brand-tint px-4 py-2 font-rounded text-13 font-bold text-brand-deep"
              : "cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-13 text-ink2 hover:bg-brand-tint"
          }
        >
          <input
            type="radio"
            name="preset"
            className="sr-only"
            checked={preset === "custom"}
            onChange={() => setPreset("custom")}
          />
          日付を指定
        </label>

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

      <div className="mt-3 flex gap-2">
        <Button size={38} onClick={() => onSubmit(preset, customDate)}>
          {pending ? "保存中…" : "保存する"}
        </Button>
        <Button variant="outline" size={38} onClick={onCancel}>
          やめる
        </Button>
      </div>
    </div>
  );
}
