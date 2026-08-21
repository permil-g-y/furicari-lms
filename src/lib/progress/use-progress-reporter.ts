"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 再生位置をサーバーへ保存するためのフック。
 *
 * ■ 送るタイミング
 *   1. 再生中は 30 秒間隔（SAVE_INTERVAL_MS）
 *   2. 一時停止したとき
 *   3. 離脱するとき（タブが隠れた / ページを閉じた / 別レッスンへ移った）
 *
 * ■ 離脱時だけ sendBeacon を使う理由
 *   ページが閉じられる瞬間の fetch はブラウザに中断されることがある。
 *   sendBeacon はページが消えても送信を完了してくれる。
 *   Server Action は URL を持たないため sendBeacon から呼べない。
 *   これが再生位置の保存だけ Route Handler にしてある理由。
 *
 * ■ 位置は単調増加でしか扱わない
 *   保持するのは「到達した最も先の位置」。巻き戻して見直しても減らない。
 *   PC 用と Mobile 用のプレイヤーは同時に DOM 上へ存在するため、
 *   表示されていない側から 0 が送られ得るが、
 *   クライアント側の max とサーバー側の max の二重で弾かれる。
 */

/** 再生位置を保存する間隔（30 秒） */
const SAVE_INTERVAL_MS = 30_000;
const ENDPOINT = "/api/progress";

export function useProgressReporter(lessonId: string, initialSeconds: number) {
  /** これまでに到達した最も先の位置 */
  const furthest = useRef(initialSeconds);
  /**
   * プレイヤーが報告した実際の動画の尺。
   * DB の duration_seconds は編集者が入れる表示用の値で実尺と食い違うことがあるため、
   * 90% 判定の分母としてサーバーへ一緒に送る。
   */
  const realDuration = useRef<number | null>(null);
  /** 直近でサーバーへ送れた位置 */
  const saved = useRef(initialSeconds);
  /** 送信処理。effect の中で組み立て、イベントハンドラからも呼べるよう ref に置く */
  const flushRef = useRef<(useBeacon: boolean) => void>(() => {});

  /** 90% を超えてサーバーが完了と判定したか */
  const [autoCompleted, setAutoCompleted] = useState(false);

  useEffect(() => {
    // レッスンが変わったら基準を引き直す
    furthest.current = initialSeconds;
    saved.current = initialSeconds;
    realDuration.current = null;
    let disposed = false;

    const flush = (useBeacon: boolean) => {
      const seconds = Math.round(furthest.current);
      const previous = saved.current;
      if (seconds <= previous) return;

      saved.current = seconds;
      const payload = JSON.stringify({
        lessonId,
        positionSeconds: seconds,
        durationSeconds: realDuration.current ?? undefined,
      });

      if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          ENDPOINT,
          new Blob([payload], { type: "application/json" }),
        );
        return;
      }

      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        // ページ遷移中でも送信を続けさせる
        keepalive: true,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!disposed && data?.status === "completed") setAutoCompleted(true);
        })
        .catch(() => {
          // 送れなかったので、次の周期で送り直せるよう戻す
          saved.current = previous;
        });
    };

    flushRef.current = flush;

    const timer = setInterval(() => flush(false), SAVE_INTERVAL_MS);

    /** タブが隠れた＝離脱の可能性がある。モバイルではこれが最後の機会になる */
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    const onPageHide = () => flush(true);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      // 別のレッスンへ移るときも取りこぼさない
      flush(true);
    };
  }, [lessonId, initialSeconds]);

  return {
    /** プレイヤーの再生位置と実尺を受け取る（送信はしない） */
    reportTime(seconds: number, durationSeconds?: number) {
      if (
        typeof durationSeconds === "number" &&
        Number.isFinite(durationSeconds) &&
        durationSeconds > 0
      ) {
        realDuration.current = durationSeconds;
      }
      if (Number.isFinite(seconds) && seconds > furthest.current) {
        furthest.current = seconds;
      }
    },
    /** 一時停止したので今すぐ保存する */
    flushNow() {
      flushRef.current(false);
    },
    autoCompleted,
  };
}
