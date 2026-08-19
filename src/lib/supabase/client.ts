import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * ブラウザ（Client Component）用の Supabase クライアント。
 * セッションは Cookie に保存され、proxy.ts が自動更新する。
 */
export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
  );
}
