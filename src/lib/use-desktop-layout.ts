"use client";

import { useSyncExternalStore } from "react";

/**
 * いま描画されているのが PC 版レイアウトかどうか。
 *
 * ■ なぜ必要か
 *   動画閲覧ページは PC 版と Mobile 版のプレイヤーを**両方 DOM に置き**、
 *   Tailwind の `lg:hidden` / `hidden lg:block` で出し分けている（Phase 1 の構造）。
 *   ダミープレイヤーの間はそれで問題なかったが、本物の Cloudflare プレイヤーを
 *   同じ署名トークンで 2 つ同時に初期化すると衝突し、
 *   "An unknown error occurred" になって再生できなくなる。
 *   動画を二重にダウンロードすることにもなるため、
 *   実際に表示されている側にだけ再生ソースを渡す。
 *
 * ■ 判定は Tailwind の lg（1024px）に合わせる
 *   ここを変えると出し分けとプレイヤーの実体がずれるので、
 *   ブレイクポイントを変更するときは必ず両方を合わせること。
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useIsDesktopLayout(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    // サーバーでは画面幅が分からないので PC 版として描く。
    // Mobile ではハイドレーション直後に一度だけ切り替わる。
    () => true,
  );
}
