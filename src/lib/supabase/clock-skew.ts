/**
 * ログイン直後の PGRST303「JWT issued at future」を吸収する。
 *
 * ■ 何が起きているか
 *   ログイン直後の最初の画面描画で、Supabase への問い合わせが
 *   401 / PGRST303（JWT の iat が未来）で失敗する。
 *   「もう一度試す」を押すと成功するため、受講生はログインのたびに
 *   一度エラー画面を見ることになる。
 *
 *   JWT の iat は **Supabase の GoTrue が発行時に付ける**もので、
 *   アプリやこの端末の時計は関与しない。検証するのは Supabase の PostgREST。
 *   つまり Supabase 側の 2 つのサービスの時計が秒未満でずれている間だけ、
 *   「まだ来ていない時刻に発行されたトークン」に見える。
 *   iat は秒単位に切り捨てられるため、ずれの上限はおよそ 1 秒。
 *
 *   実測値は警告ログに出す（iat とサーバー時刻の差）。
 *   原因が Supabase 側にある以上、どれくらいずれているのかが分からないと
 *   「直ったのか、たまたま出ていないだけなのか」を判断できない。
 *
 * ■ なぜリトライで対処するのか
 *   - ずれの原因がアプリ側に無い以上、こちらで出来るのは耐えることだけ
 *   - **認証は一切緩めていない。** 送るトークンは同じで、Supabase が同じように
 *     完全な検証を行う。秒未満の時計競合が解けるまで待って投げ直すだけ
 *   - 失効・改ざん・権限不足（401 の他の理由や 403）は 1 度も再試行しない。
 *     再試行するのは **PGRST303 のときだけ**
 *
 * ■ なぜ fetch に入れるのか
 *   ログイン直後は教材・進捗・お知らせ・受講権限が同時に走る。
 *   呼び出し側ごとに書くと必ず書き漏れる。
 *   Supabase クライアントの出口は fetch 1 箇所なので、
 *   ここに置けば全経路が同じ扱いになる。
 */

/** PostgREST が「iat が未来」を表すのに使うコード */
export const CLOCK_SKEW_CODE = "PGRST303";

/**
 * 待ち時間。iat の切り捨てにより、ずれの理屈上の上限は約 1 秒。
 * 合計 1.05 秒まで粘れば足りる。
 */
export const DEFAULT_RETRY_DELAYS_MS = [150, 300, 600];

type Options = {
  /** 実際に通信する fetch。テストから差し替える */
  fetchImpl?: typeof fetch;
  delaysMs?: readonly number[];
  sleep?: (ms: number) => Promise<void>;
  onSkewDetected?: (info: { iat: number | null; serverEpoch: number | null }) => void;
  onGiveUp?: () => void;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 計測用に iat だけを取り出す。
 *
 * **検証はしない**（検証は Supabase 側が行う）。
 * ログに出すのは数値だけで、トークンそのものはどこにも出さない。
 */
export function readIssuedAt(headers: HeadersInit | undefined): number | null {
  if (!headers) return null;
  const auth = new Headers(headers).get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const iat = (JSON.parse(json) as { iat?: unknown }).iat;
    return typeof iat === "number" ? iat : null;
  } catch {
    return null;
  }
}

/** レスポンス本文が PGRST303 かどうか。本文は 1 度しか読めないので複製して見る */
async function isClockSkewError(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as { code?: unknown };
    return body?.code === CLOCK_SKEW_CODE;
  } catch {
    // JSON でない（HTML のエラーページなど）なら対象外
    return false;
  }
}

/**
 * 同じ内容で投げ直せるリクエストか。
 * 本文がストリームの場合、2 回目は既に読み終わっていて送れない。
 * supabase-js は文字列で送るため通常は該当しないが、念のため確認する。
 */
export function isReplayable(init: RequestInit | undefined): boolean {
  const body = init?.body;
  return body === undefined || body === null || typeof body === "string";
}

export function createClockSkewTolerantFetch(options: Options = {}): typeof fetch {
  const {
    fetchImpl = fetch,
    delaysMs = DEFAULT_RETRY_DELAYS_MS,
    sleep = defaultSleep,
    onSkewDetected,
    onGiveUp,
  } = options;

  return async function clockSkewTolerantFetch(input, init) {
    let response = await fetchImpl(input, init);

    for (let attempt = 0; attempt < delaysMs.length; attempt++) {
      if (response.ok) return response;
      if (!isReplayable(init)) return response;
      if (!(await isClockSkewError(response))) return response;

      if (attempt === 0) {
        const serverDate = response.headers.get("date");
        onSkewDetected?.({
          iat: readIssuedAt(init?.headers),
          serverEpoch: serverDate ? Math.floor(Date.parse(serverDate) / 1000) : null,
        });
      }

      await sleep(delaysMs[attempt]);
      response = await fetchImpl(input, init);
    }

    if (!response.ok && (await isClockSkewError(response))) onGiveUp?.();
    return response;
  };
}

/** アプリで使う既定の設定（ログ出力つき） */
export function createDefaultClockSkewTolerantFetch(): typeof fetch {
  return createClockSkewTolerantFetch({
    onSkewDetected: ({ iat, serverEpoch }) => {
      const gap =
        iat !== null && serverEpoch !== null ? `${iat - serverEpoch}秒` : "不明";
      console.warn(
        `[supabase] ${CLOCK_SKEW_CODE}: トークンの発行時刻が Supabase の時刻より先行しています` +
          `（iat - サーバー時刻 = ${gap}）。時計差が解けるまで再試行します。`,
      );
    },
    onGiveUp: () => {
      console.error(
        `[supabase] ${CLOCK_SKEW_CODE} が再試行後も解消しませんでした。` +
          " Supabase 側の時刻同期を確認してください。",
      );
    },
  });
}
