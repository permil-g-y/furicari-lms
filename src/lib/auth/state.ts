/**
 * 認証フォームの実行結果。
 *
 * `"use server"` のファイル（actions.ts）からは async 関数しか export できないため、
 * 型と定数はこちらに分ける。クライアント側はこのファイルから import すること。
 */
export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialAuthState: AuthActionState = { status: "idle", message: "" };
