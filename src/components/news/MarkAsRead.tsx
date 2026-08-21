"use client";

import { useEffect, useRef, useTransition } from "react";
import { markAnnouncementRead } from "@/lib/news/actions";

/**
 * お知らせ詳細を開いたことを記録するだけのコンポーネント。何も描画しない。
 *
 * Server Component 側で既読にしないのは、Next.js がリンクのホバーだけで
 * プリフェッチするため。一覧でマウスを乗せただけのお知らせが既読になってしまう。
 * 実際に画面へ出たときにだけ動くこの effect が正しい位置。
 */
export function MarkAsRead({ slug }: { slug: string }) {
  const [, startTransition] = useTransition();
  const markedFor = useRef<string | null>(null);

  useEffect(() => {
    if (markedFor.current === slug) return;
    markedFor.current = slug;
    startTransition(async () => {
      await markAnnouncementRead(slug);
    });
  }, [slug]);

  return null;
}
