"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { validateDraft, type DraftInput } from "./announcement-draft";

/**
 * お知らせの作成・編集・公開。
 *
 * ログイン中の admin 自身の権限（RLS の "Admins manage announcements"）で書く。
 * Secret Key は使わない。
 */

export type AnnouncementActionResult =
  | { ok: true; slug: string }
  | { ok: false; message: string };

/** 受講生側の表示へ即座に反映する */
function revalidateNews(slug: string) {
  revalidatePath("/admin/announcements");
  revalidatePath(`/admin/announcements/${slug}`);
  // 一覧・詳細・TOP・ヘッダーの未読ドットまで作り直す
  revalidatePath("/", "layout");
}

export async function saveAnnouncement(input: {
  /** 既存を編集する場合の id。新規なら null */
  id: string | null;
  draft: DraftInput;
}): Promise<AnnouncementActionResult> {
  await requireAdmin();

  const validated = validateDraft(input.draft);
  if (!validated.ok) return { ok: false, message: validated.message };
  const draft = validated.draft;

  const supabase = await createClient();

  const row = {
    slug: draft.slug,
    title: draft.title,
    category: draft.category,
    body: draft.body as unknown as Json,
    published_at: draft.publishedAt,
    is_published: draft.isPublished,
  };

  const query = input.id
    ? supabase.from("announcements").update(row).eq("id", input.id)
    : supabase.from("announcements").insert(row);

  const { error } = await query;

  if (error) {
    // slug の重複はよくある操作ミスなので、原因が分かる文言にする
    if (error.code === "23505") {
      return {
        ok: false,
        message: `URL 用の ID「${draft.slug}」は既に使われています。別の ID にしてください。`,
      };
    }
    return { ok: false, message: `保存できませんでした: ${error.message}` };
  }

  revalidateNews(draft.slug);
  return { ok: true, slug: draft.slug };
}

/**
 * 公開 / 非公開の切り替え。
 *
 * 一覧から 1 クリックで切り替えたいので、保存とは別の入口にしている。
 * 公開するときは本文が空でないことをここでも確認する
 *（画面の出し分けだけに任せない）。
 */
export async function setAnnouncementPublished(input: {
  id: string;
  slug: string;
  published: boolean;
}): Promise<AnnouncementActionResult> {
  await requireAdmin();

  const supabase = await createClient();

  if (input.published) {
    const { data, error } = await supabase
      .from("announcements")
      .select("body")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return { ok: false, message: `確認できませんでした: ${error.message}` };
    const body = Array.isArray(data?.body) ? data.body : [];
    if (body.length === 0) {
      return { ok: false, message: "本文が空のお知らせは公開できません。" };
    }
  }

  const { error } = await supabase
    .from("announcements")
    .update({ is_published: input.published })
    .eq("id", input.id);

  if (error) return { ok: false, message: `保存できませんでした: ${error.message}` };

  revalidateNews(input.slug);
  return { ok: true, slug: input.slug };
}
