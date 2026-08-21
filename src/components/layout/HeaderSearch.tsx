"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SearchGlyph } from "@/components/ui/Icon";

/**
 * ヘッダーの検索入力。
 *
 * Phase 1 では見た目だけのリンク（/videos へ飛ぶだけ）だったものを、
 * 実際に検索できる入力欄に差し替える。
 * 枠の高さ・幅・角丸・配色は Phase 1 のリンクと同じ値を使っており、
 * 見た目は変わらない。
 */
export function HeaderSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex h-11 w-[220px] items-center gap-2.5 rounded-full border border-line bg-page px-4 transition-colors focus-within:border-brand-tint2 hover:border-brand-tint2"
    >
      <SearchGlyph size={15} />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="動画・コースを検索"
        aria-label="動画・コースを検索"
        className="min-w-0 flex-1 bg-transparent text-135 text-ink outline-none placeholder:text-ink4"
      />
    </form>
  );
}
