"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { startVideoUpload, syncVideoState } from "@/lib/admin/lesson-actions";
import { videoBucket, type AdminLesson } from "@/lib/admin/lessons";
import { VideoStatusTag } from "./VideoStatusTag";

/**
 * 動画のアップロードと公開。
 *
 * ■ 動画はこのアプリのサーバーを通らない
 *   サーバーは Cloudflare から 1 回きりのアップロード URL をもらうだけで、
 *   ファイル本体はブラウザから Cloudflare へ直接送る。
 *   Vercel の関数にはリクエストボディの上限があり、数百 MB は通せないため。
 *   API トークンはブラウザへ渡らない。
 *
 * ■ 公開の切り替えはここに置かない
 *   このカードは **動画があるレッスンでしか描画されない**。
 *   ここに公開ボタンを置くと、動画を持たないレッスンの公開状態を
 *   管理画面から変えられなくなる（89 本がその状態だった）。
 *   公開はレッスンの属性なので、レッスンの編集側に置いている。
 *
 * ■ アップロード後にすぐ「完了」と言わない
 *   Cloudflare 側の変換が終わるまで再生できない。
 *   変換完了まで状態を問い合わせ、ready になってはじめて公開できるようにする。
 */

/** Cloudflare の基本アップロードが受け付ける上限 */
const MAX_BYTES = 200 * 1024 * 1024;

type Phase = "idle" | "uploading" | "processing" | "done" | "failed";

export function VideoUploader({ lesson }: { lesson: AdminLesson }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setMessage(null);

    if (file.size > MAX_BYTES) {
      setMessage(
        `このファイルは ${Math.round(file.size / 1024 / 1024)}MB あります。200MB までのファイルを選んでください。`,
      );
      return;
    }

    setPhase("uploading");
    setProgress(0);

    const started = await startVideoUpload(lesson.slug);
    if (!started.ok) {
      setPhase("failed");
      setMessage(started.message);
      return;
    }

    try {
      await postFile(started.data.uploadUrl, file, setProgress);
    } catch (cause) {
      setPhase("failed");
      setMessage(
        cause instanceof Error
          ? `アップロードに失敗しました: ${cause.message}`
          : "アップロードに失敗しました。",
      );
      return;
    }

    // ここからは Cloudflare 側の変換待ち
    setPhase("processing");
    setMessage("Cloudflare で動画を処理しています。完了までしばらくかかります。");
    const outcome = await waitUntilReady(lesson.slug, setMessage);
    setPhase(outcome === "error" ? "failed" : "done");
    router.refresh();
  }

  const bucket = videoBucket(lesson);

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
        <h2 className="font-rounded text-16 font-bold text-ink">動画</h2>
        <VideoStatusTag bucket={bucket} />
        {lesson.streamSyncedAt && (
          <span className="text-125 text-ink4">
            最終同期 {new Date(lesson.streamSyncedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </span>
        )}
      </div>

      <div className="px-6 py-5">
        {lesson.streamError && (
          <p className="mb-4 rounded-xl border border-danger-line bg-pink-bg px-4 py-3 text-13 text-danger">
            {lesson.streamError}
          </p>
        )}

        <label className="inline-flex cursor-pointer items-center rounded-full border border-brand-tint2 bg-surface px-5 py-3 font-rounded text-14 font-bold text-brand-deep transition-colors hover:bg-brand-tint">
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={phase === "uploading" || phase === "processing"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          {lesson.streamVideoId ? "動画を差し替える" : "動画をアップロード"}
        </label>

        {phase === "uploading" && (
          <div className="mt-4">
            <div className="h-2 w-full max-w-[420px] overflow-hidden rounded-full bg-brand-tint">
              <div
                className="h-full rounded-full bg-brand transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-125 text-ink2">送信中 {progress}%</p>
          </div>
        )}

        {message && <p className="mt-4 text-13 text-ink2">{message}</p>}

        {lesson.streamVideoId && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size={38}
              onClick={() => {
                setMessage(null);
                void syncVideoState(lesson.slug).then((result) => {
                  setMessage(result.ok ? "動画情報を取得しました。" : result.message);
                  router.refresh();
                });
              }}
            >
              動画情報を取得
            </Button>

          </div>
        )}

        <p className="mt-4 text-115 text-ink4">
          動画はこのサイトのサーバーを経由せず、ブラウザから Cloudflare へ直接送られます。
          処理が完了するまで公開できません。
        </p>
      </div>
    </section>
  );
}

/**
 * Cloudflare のワンタイム URL へ送る。
 *
 * multipart/form-data の `file` フィールドで POST する（Cloudflare の仕様）。
 * 進捗を出すために fetch ではなく XMLHttpRequest を使う。
 */
function postFile(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", uploadUrl);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Cloudflare が ${request.status} を返しました`));
    });
    request.addEventListener("error", () => reject(new Error("通信に失敗しました")));
    request.send(form);
  });
}

/**
 * 変換が終わるまで状態を問い合わせる。
 *
 * Cloudflare は完了時刻を教えてくれないため、間隔を空けながら確認する。
 * 公式にも推奨間隔の記載は無い。長い動画でも待ち切れるよう、
 * 徐々に間隔を伸ばして最大 5 分ほど粘る。
 *
 * ■ 決着がついたら必ず止める
 *   以前は結果に関わらず最後まで回していたため、変換が終わったあとも
 *   数分間ポーリングと router.refresh() が続いていた。
 *   その再描画が、運営が押した「公開する」と競合して
 *   **クリックが無かったことになる**（実際に E2E で 1 回目の公開が失われた）。
 *   ready / error が確定した時点で抜ける。
 */
async function waitUntilReady(
  slug: string,
  onMessage: (text: string) => void,
): Promise<"ready" | "error" | "timeout"> {
  const delays = [3000, 3000, 5000, 5000, 8000, 8000, 12000, 15000, 20000, 30000, 30000, 60000, 60000];
  for (const delay of delays) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const result = await syncVideoState(slug);
    if (!result.ok) {
      onMessage(result.message);
      return "error";
    }
    if (result.data.status === "ready") {
      onMessage("動画の処理が完了しました。公開できます。");
      return "ready";
    }
    if (result.data.status === "error") {
      onMessage("動画の処理に失敗しました。ファイルを確認して入れ直してください。");
      return "error";
    }
    onMessage("処理状況を確認しています…");
  }
  onMessage(
    "処理に時間がかかっています。しばらくしてから「動画情報を取得」を押して確認してください。",
  );
  return "timeout";
}
