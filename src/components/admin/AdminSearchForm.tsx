"use client";

import { useSearchParams } from "next/navigation";

/**
 * 管理画面の絞り込み。
 *
 * 受講生画面のヘッダー検索と同じく、素の <form> で GET する。
 * 入力のたびに再取得する必要が無く、URL がそのまま共有できるため
 * （運営同士で「この状態の一覧を見て」と渡せる）。
 */
export function AdminSearchForm({ placeholder }: { placeholder: string }) {
  const params = useSearchParams();

  return (
    <form action="" method="get" role="search">
      <input
        type="search"
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder={placeholder}
        className="h-11 w-full max-w-[360px] rounded-full border border-line bg-surface px-5 text-14 text-ink outline-none transition-colors placeholder:text-ink4 focus:border-brand-tint2"
      />
    </form>
  );
}
