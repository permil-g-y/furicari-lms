"use client";

import { useEffect } from "react";

/**
 * 予期しないエラーのフォールバック UI。
 *
 * ■ なぜルート直下に置くのか
 *   error.js は「同じセグメントの layout.js」を包まない。
 *   教材と学習進捗の取得は (main)/layout.tsx で行っているため、
 *   そこで投げられたエラーを受け止められるのは親セグメント＝ここだけ。
 *   （app/layout.tsx 自体のエラーは global-error.js の領域だが、
 *     ルートレイアウトはデータ取得をしないので用意していない）
 *
 * ■ 何を解決するためのものか
 *   Supabase 側の一時的な不調（Auth と PostgREST のクロックずれによる
 *   PGRST303「JWT issued at future」など）で、ログイン直後の 1 回だけ
 *   データ取得が弾かれることがある。数秒後には同じ操作が通る。
 *   以前はこれが素のクラッシュ画面になっていたので、
 *   Next.js が用意している retry() で「もう一度試す」導線に置き換えた。
 *
 * ■ 自動リトライはしない
 *   原因を切り分けられないまま再試行を繰り返すと、本当に壊れているときに
 *   同じ失敗を隠したまま繰り返すことになる。復帰の判断は利用者に委ねる。
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  /** Next.js 16 の error.js が渡す再試行関数（旧 API の reset ではない） */
  retry: () => void;
}) {
  useEffect(() => {
    // 本番ではメッセージが伏せられ digest だけが渡る。
    // サーバー側のログと突き合わせるための手掛かりとして残す。
    console.error("[app] 画面の描画に失敗しました:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-5">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-5 rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
        <h1 className="font-rounded text-19 font-bold text-ink">
          画面を読み込めませんでした
        </h1>
        <p className="text-135 leading-[1.8] text-ink3">
          一時的に通信がうまくいかなかったようです。
          <br />
          少し時間をおいて、もう一度お試しください。
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="flex h-12 cursor-pointer items-center rounded-full bg-brand px-7 text-14 font-bold text-white transition-colors hover:bg-brand-deep"
        >
          もう一度試す
        </button>
      </div>
    </main>
  );
}
