"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { syncAllVideos } from "@/lib/admin/lesson-actions";

/**
 * 全動画の情報を Cloudflare から取り直す。
 *
 * 対象は **動画を持つレッスンだけ**。件数をボタンに出して、
 * 「90 本すべてを同期する」という誤解が起きないようにする。
 */
export function SyncAllButton({ targetCount }: { targetCount: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (targetCount === 0) {
    return <span className="text-125 text-ink4">同期対象の動画はまだありません</span>;
  }

  return (
    <div className="text-right">
      <Button
        variant="outline-brand"
        size={40}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await syncAllVideos();
            setMessage(
              result.ok
                ? `${result.data.synced} 本を同期しました${result.data.failed > 0 ? `（失敗 ${result.data.failed} 本）` : ""}`
                : result.message,
            );
          });
        }}
      >
        {pending ? "同期中…" : `動画情報を同期（${targetCount} 本）`}
      </Button>
      {message && <p className="mt-2 text-125 text-ink2">{message}</p>}
    </div>
  );
}
