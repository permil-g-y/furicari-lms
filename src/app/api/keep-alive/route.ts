import { type NextRequest } from "next/server";

/**
 * Supabase Free プランの自動一時停止を防ぐための定期アクセス。
 *
 * ■ なぜ必要か
 *   Free プランは「7 日間アクティビティが無い」とプロジェクトが自動停止され、
 *   停止中は DNS レコードごと消えるためログインを含む全通信が失敗する。
 *   2026-11-11 に実際に発生した（最終ログイン 2026-09-23 → 約 7 週間無通信）。
 *
 * ■ なぜ Vercel の URL を叩くだけでは駄目なのか
 *   Supabase が見ているのは Supabase 側のアクティビティで、Vercel の稼働は無関係。
 *   そのため**必ず Postgres まで到達するクエリ**を 1 本投げる必要がある。
 *   anon / service_role にはテーブル権限が無いので、専用の RPC
 *   `public.keep_alive()`（now() を返すだけ）を呼ぶ。
 *
 * ■ 何を信用しないか
 *   Vercel Cron は `Authorization: Bearer ${CRON_SECRET}` を付けて呼んでくる。
 *   CRON_SECRET が設定されていれば必ず検証する。
 *   未設定のまま本番で公開されると誰でも叩けてしまうので、
 *   本番では未設定自体を 500 として失敗させる（黙って無防備にしない）。
 *
 * ■ これは応急策である
 *   Cron が静かに失敗すれば再発する。
 *   恒久対策は Supabase Pro への移行（自動停止が無くなる）。
 */

/** 停止条件は 7 日。1 日 1 回なら 6 回連続で失敗しても間に合う。 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      console.error("keep-alive: CRON_SECRET が未設定のため実行を拒否しました");
      return Response.json({ ok: false, reason: "not_configured" }, { status: 500 });
    }
    // ローカルでは手で叩いて確認できるようにする。
  } else if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("keep-alive: Supabase の環境変数が揃っていません");
    return Response.json({ ok: false, reason: "not_configured" }, { status: 500 });
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`${url}/rest/v1/rpc/keep_alive`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      // 本文には秘密情報が入らない（keep_alive は now() しか返さない）。
      const detail = (await response.text()).slice(0, 200);
      console.error(
        `keep-alive: 失敗 status=${response.status} elapsedMs=${elapsedMs} detail=${detail}`,
      );
      return Response.json(
        { ok: false, reason: "supabase_error", status: response.status },
        { status: 502 },
      );
    }

    const dbTime = (await response.json()) as unknown;
    console.log(`keep-alive: 成功 elapsedMs=${elapsedMs} dbTime=${String(dbTime)}`);

    return Response.json({ ok: true, dbTime, elapsedMs });
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    // ネットワーク到達不能（= 既に一時停止されている可能性）もここに来る。
    console.error(
      `keep-alive: 到達不能 elapsedMs=${elapsedMs} error=${
        error instanceof Error ? error.message : "unknown"
      }`,
    );
    return Response.json({ ok: false, reason: "unreachable" }, { status: 502 });
  }
}
