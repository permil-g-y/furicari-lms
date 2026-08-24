"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { moveLesson } from "@/lib/admin/lesson-actions";

/**
 * コース内での並び替え。
 * 動かすと番号（01, 02 …）も振り直されるため、受講生から見て番号が飛ばない。
 */
export function LessonOrderButtons({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(direction: -1 | 1) {
    setError(null);
    startTransition(async () => {
      const result = await moveLesson(slug, direction);
      if (!result.ok) setError(result.message);
      router.refresh();
    });
  }

  return (
    <div className="text-right">
      <div className="flex gap-2">
        <Button variant="outline" size={38} onClick={() => move(-1)}>
          {pending ? "…" : "↑ 前へ"}
        </Button>
        <Button variant="outline" size={38} onClick={() => move(1)}>
          {pending ? "…" : "↓ 後へ"}
        </Button>
      </div>
      {error && <p className="mt-2 text-125 text-danger">{error}</p>}
    </div>
  );
}
