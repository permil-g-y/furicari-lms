import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";
import { createDefaultClockSkewTolerantFetch } from "./clock-skew";

/**
 * サーバー（Server Component / Server Action / Route Handler）用の
 * Supabase クライアント。
 *
 * Server Component からは Cookie を書き込めないため、setAll は失敗し得る。
 * その場合はセッション更新を proxy.ts に任せるので握りつぶしてよい。
 *
 * fetch を差し替えているのは、ログイン直後だけ起きる Supabase 側の
 * 秒未満の時計差（PGRST303）を吸収するため。詳細は ./clock-skew.ts を参照。
 * 認証そのものは一切緩めていない。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component から呼ばれたケース。
            // セッションの更新は proxy.ts が行うため無視して問題ない。
          }
        },
      },
      global: { fetch: createDefaultClockSkewTolerantFetch() },
    },
  );
}
