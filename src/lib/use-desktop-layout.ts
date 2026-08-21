"use client";

import { useEffect, useState } from "react";

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
 * ■ useSyncExternalStore を使っていない理由
 *   最初は useSyncExternalStore で書いていたが、**ハイドレーション後に
 *   クライアント側の値へ同期し直されなかった**（実測：Mobile 幅で開いても
 *   isDesktop が true のままで、本物のプレイヤーが一度もマウントされない。
 *   ウィンドウをリサイズして change イベントが飛んだときだけ直る）。
 *   購読自体は動くが初回の同期だけが起きないため、
 *   確実に動く「マウント後に読む」形へ切り替えた。
 *
 * ■ 初回の反映を requestAnimationFrame に載せている理由
 *   ハイドレーション直後の描画を待ってから状態を変えることで、
 *   描画の途中で切り替わることによるちらつきを避ける。
 *
 * ■ 判定は Tailwind の lg（1024px）に合わせる
 *   ここを変えると出し分けとプレイヤーの実体がずれるので、
 *   ブレイクポイントを変更するときは必ず両方を合わせること。
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

export function useIsDesktopLayout(): boolean {
  // サーバーでは画面幅が分からないので PC 版として描き、
  // マウント後に実際の幅で上書きする。
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(query.matches);

    const initial = requestAnimationFrame(sync);
    query.addEventListener("change", sync);

    return () => {
      cancelAnimationFrame(initial);
      query.removeEventListener("change", sync);
    };
  }, []);

  return isDesktop;
}
