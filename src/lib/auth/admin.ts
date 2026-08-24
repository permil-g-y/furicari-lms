import "server-only";

import { redirect } from "next/navigation";
import { requireUser, type SessionUser } from "./user";

/**
 * 管理画面用の認可。
 *
 * ■ 三重の防御のうち、ここは 2 層目
 *   1. proxy.ts        … 未ログインを /login へ落とす（既存の catch-all で /admin も対象）
 *   2. requireAdmin()  … ここ。admin でなければ受講生トップへ戻す
 *   3. RLS             … 1・2 を抜けても DB が admin 以外の読み書きを拒否する
 *
 *   守っているのは 3 で、1・2 は「画面に辿り着かせない」ための層でしかない。
 *   **画面を隠すことをセキュリティの本体にしない。**
 *
 * ■ 404 ではなく / へ戻す理由
 *   管理画面の存在自体は秘密ではない（受講生に URL が漏れても RLS で守られる）。
 *   誤って開いた運営スタッフ以外の人が迷子にならないよう、素直にトップへ返す。
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
