"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { getContentBundle } from "@/lib/content/server";
import { recordAdminAction } from "./audit";
import { resolveExpiry } from "./expiry";
import { describeOutcome, validateEmail, type InviteOutcome } from "./invite";

/**
 * 受講生の招待。
 *
 * ■ ここだけが Secret Key を使う
 *   auth.admin.inviteUserByEmail() は Admin API でしか呼べない。
 *   Phase 7 の中で RLS を貫通する鍵を使うのはこの 1 経路だけで、
 *   呼ぶ直前に必ず requireAdmin() を通す。
 *   これにより「強い鍵が使われる場所」がコード上 1 箇所に固定され、レビューできる。
 *
 * ■ 招待と受講権限の付与を必ず同じ操作にする
 *   別作業にすると必ず付与漏れが起きる（そして受講生は何も見られない）。
 *
 * ■ 部分失敗しても運営が復旧できるようにする
 *   招待メールは取り消せない。付与だけ失敗したときに
 *   まとめてエラーにすると、運営は「招待もされていない」と誤解して
 *   もう一度招待し、受講生には 2 通目が届く。
 *   そのため **招待が成功したら結果は成功として返し**、
 *   付与できなかったコースを名指しで伝える。
 *   その状態は受講生一覧で「招待済み・権限未設定」として拾える。
 */

export type InviteActionResult =
  | { ok: true; tone: "success" | "warning"; message: string; userId: string }
  | { ok: false; message: string };

export async function inviteStudent(input: {
  email: string;
  courseSlugs: string[];
  preset: string;
  customDate: string;
}): Promise<InviteActionResult> {
  const admin = await requireAdmin();

  const emailCheck = validateEmail(input.email);
  if (!emailCheck.ok) return { ok: false, message: emailCheck.message };
  const email = emailCheck.email;

  const expiry = resolveExpiry(input.preset, input.customDate);
  if ("error" in expiry) return { ok: false, message: expiry.error };

  const content = await getContentBundle();
  const courses = input.courseSlugs
    .map((slug) => {
      const uuid = content.ids.courseUuidBySlug.get(slug);
      const course = content.snapshot.courses.find((c) => c.id === slug);
      return uuid && course ? { slug, uuid, title: course.title } : null;
    })
    .filter((c): c is { slug: string; uuid: string; title: string } => c !== null);

  const supabase = await createClient();

  // 既に登録済みかを先に確認する。
  // inviteUserByEmail は登録済みだとエラーになるが、運営がやりたいのは
  // 「この人に権限を付けたい」なので、単純なエラーで終わらせない。
  const { data: existing, error: lookupError } = await supabase
    .rpc("admin_list_students")
    .then((result) => ({
      data: result.data?.find((row) => row.email.toLowerCase() === email) ?? null,
      error: result.error,
    }));

  if (lookupError) {
    return { ok: false, message: `既存ユーザーの確認に失敗しました: ${lookupError.message}` };
  }

  let userId: string;
  let kind: InviteOutcome["kind"];

  if (existing) {
    userId = existing.id;
    kind = "existing_granted";
  } else {
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return {
        ok: false,
        message:
          "招待に必要なサーバー設定（SUPABASE_SECRET_KEY）がありません。環境変数を設定してください。",
      };
    }

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/confirm?next=/set-password`,
    });

    if (error || !data?.user) {
      return {
        ok: false,
        message: `招待メールを送れませんでした: ${error?.message ?? "原因不明"}`,
      };
    }
    userId = data.user.id;
    kind = "invited";

    await recordAdminAction({
      actor: admin,
      action: "user.invite",
      targetType: "user",
      targetId: userId,
      targetLabel: email,
      detail: { courseSlugs: courses.map((c) => c.slug) },
    });
  }

  // 受講権限の付与。1 コースずつ結果を見る（まとめて失敗させない）
  const grantedCourses: string[] = [];
  const failedCourses: string[] = [];

  for (const course of courses) {
    const { error } = await supabase.from("user_course_enrollments").upsert(
      { user_id: userId, course_id: course.uuid, expires_at: expiry.expiresAt },
      { onConflict: "user_id,course_id" },
    );

    if (error) {
      console.error(
        `[admin] 招待後の受講権限付与に失敗しました user=${userId} course=${course.slug}: ${error.message}`,
      );
      failedCourses.push(course.title);
      continue;
    }

    grantedCourses.push(course.title);
    await recordAdminAction({
      actor: admin,
      action: "enrollment.grant",
      targetType: "user",
      targetId: userId,
      targetLabel: course.title,
      detail: {
        courseSlug: course.slug,
        expiresAt: expiry.expiresAt,
        viaInvite: true,
      },
    });
  }

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${userId}`);

  const { tone, message } = describeOutcome({
    kind,
    userId,
    email,
    grantedCourses,
    failedCourses,
  });

  return { ok: true, tone, message, userId };
}
