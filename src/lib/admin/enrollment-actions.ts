"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getContentBundle } from "@/lib/content/server";
import { recordAdminAction } from "./audit";
import { resolveExpiry } from "./expiry";

/**
 * 受講権限の付与・解除・期限変更。
 *
 * ■ Secret Key は使わない
 *   ログイン中の admin 自身の権限（RLS の "Admins manage enrollments"）で書く。
 *   RLS がそのまま認可の境界になり、誰が admin かは DB が決める。
 *
 * ■ 画面の外から呼ばれても安全にする
 *   Server Action は URL を持たないが、呼び出し自体はクライアントから起きる。
 *   そのため必ず先頭で requireAdmin() を通す。
 *   仮にここを書き忘れても RLS が最後に拒否する（多層防御）。
 */

export type ActionResult = { ok: true } | { ok: false; message: string };

async function resolveCourse(courseSlug: string) {
  const content = await getContentBundle();
  const uuid = content.ids.courseUuidBySlug.get(courseSlug);
  const course = content.snapshot.courses.find((c) => c.id === courseSlug);
  return uuid && course ? { uuid, title: course.title } : null;
}

function revalidateAdmin(userId: string) {
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${userId}`);
  // 受講生側の表示（ロック / 解除）も即座に変わるようにする
  revalidatePath("/", "layout");
}

/** 受講権限の付与、および既に持っている場合の期限変更 */
export async function grantEnrollment(input: {
  userId: string;
  courseSlug: string;
  preset: string;
  customDate: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();

  const course = await resolveCourse(input.courseSlug);
  if (!course) return { ok: false, message: "コースが見つかりません。" };

  const expiry = resolveExpiry(input.preset, input.customDate);
  if ("error" in expiry) return { ok: false, message: expiry.error };

  const supabase = await createClient();

  // 既に権限があるかどうかで、記録する操作名を変える
  const { data: existing } = await supabase
    .from("user_course_enrollments")
    .select("expires_at")
    .eq("user_id", input.userId)
    .eq("course_id", course.uuid)
    .maybeSingle();

  const { error } = await supabase
    .from("user_course_enrollments")
    .upsert(
      {
        user_id: input.userId,
        course_id: course.uuid,
        expires_at: expiry.expiresAt,
      },
      { onConflict: "user_id,course_id" },
    );

  if (error) {
    return { ok: false, message: `受講権限を保存できませんでした: ${error.message}` };
  }

  await recordAdminAction({
    actor: admin,
    action: existing ? "enrollment.update_expiry" : "enrollment.grant",
    targetType: "user",
    targetId: input.userId,
    targetLabel: course.title,
    detail: {
      courseSlug: input.courseSlug,
      expiresAt: expiry.expiresAt,
      previousExpiresAt: existing?.expires_at ?? null,
    },
  });

  revalidateAdmin(input.userId);
  return { ok: true };
}

/** 受講権限の解除 */
export async function revokeEnrollment(input: {
  userId: string;
  courseSlug: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();

  const course = await resolveCourse(input.courseSlug);
  if (!course) return { ok: false, message: "コースが見つかりません。" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_course_enrollments")
    .delete()
    .eq("user_id", input.userId)
    .eq("course_id", course.uuid);

  if (error) {
    return { ok: false, message: `受講権限を解除できませんでした: ${error.message}` };
  }

  await recordAdminAction({
    actor: admin,
    action: "enrollment.revoke",
    targetType: "user",
    targetId: input.userId,
    targetLabel: course.title,
    detail: { courseSlug: input.courseSlug },
  });

  revalidateAdmin(input.userId);
  return { ok: true };
}
