"use client";

import Link from "next/link";
import { useContent } from "@/lib/content/context";

/**
 * 動画へのリンク。
 *
 * ■ なぜ共通部品にしたか
 *   受講していないコースの動画は、サーバー側（/watch/[lessonId]）で必ず弾かれる。
 *   ただしリンクが残っていると、押しても同じ画面へ戻されるだけで、
 *   受講生からは「壊れている」としか見えない。
 *
 *   Phase 6-F でコース詳細だけを直したが、**同じ不具合が
 *   TOP・動画一覧・検索にも残っていた**（受講権限を 1 コースだけ持つ
 *   受講生を実際に招待して発覚した。admin は全コースを再生できるため
 *   管理者アカウントでは絶対に見つけられない）。
 *
 *   リンクを張る場所ごとに判定を書くと必ず書き漏れるので、
 *   **リンクを張る手段そのものをここへ集約する。**
 *
 * ■ セキュリティの本体はここではない
 *   守っているのは署名トークンを発行する前のサーバー側判定と RLS。
 *   ここは「押せないものを押させない」ための表示上の配慮でしかない。
 */
export function LessonLink({
  lessonId,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  lessonId: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const content = useContent();
  const lesson = content.getLesson(lessonId);
  const enrolled = lesson
    ? (content.getCourse(lesson.courseId)?.isEnrolled ?? false)
    : false;

  if (!enrolled) {
    // リンクにしないだけで、見た目は変えない（カードの体裁を崩さない）
    return (
      <div className={className} aria-disabled="true">
        {children}
      </div>
    );
  }

  return (
    <Link href={`/watch/${lessonId}`} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/** そのレッスンを再生できるか（CTA の出し分けなどに使う） */
export function useLessonEnrolled(lessonId: string | undefined): boolean {
  const content = useContent();
  if (!lessonId) return false;
  const lesson = content.getLesson(lessonId);
  if (!lesson) return false;
  return content.getCourse(lesson.courseId)?.isEnrolled ?? false;
}
