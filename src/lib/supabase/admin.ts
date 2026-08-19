import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseUrl } from "./env";

/**
 * 管理者権限（Secret key）付きの Supabase クライアント。
 *
 * RLS を貫通する強い権限を持つため、**サーバー上でのみ**利用すること。
 * `import "server-only"` により、クライアントバンドルへ混入した時点で
 * ビルドが失敗するようにしてある。
 *
 * Phase 2 では未使用。
 * Phase 7 の管理画面から受講生を招待する際に、この関数経由で
 * `admin.auth.admin.inviteUserByEmail()` を呼ぶ想定。
 * さらに将来は「決済完了 → 自動招待」の Webhook からも同じ入口を使う。
 */
export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY が未設定です。管理者操作にはサーバー専用の Secret key が必要です。",
    );
  }

  return createSupabaseClient<Database>(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
