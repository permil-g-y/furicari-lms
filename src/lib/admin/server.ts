import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getContentBundle } from "@/lib/content/server";
import {
  buildStudentRows,
  type AdminCourse,
  type AdminEnrollmentRecord,
  type AdminProgressRecord,
  type AdminUserRecord,
  type StudentRow,
} from "./students";

/**
 * 管理画面のデータ取得。
 *
 * 受講生画面と同じく「1 リクエストにつき 1 回だけ引いてメモリで突き合わせる」方針。
 * 受講生は当面数十人規模なので、一覧のために人数分のクエリを撃つ必要はない。
 *
 * ここで使うのは **ログイン中の admin 自身の権限**（RLS 経由）だけ。
 * Secret Key はここでは一切使わない（使うのは招待の 1 経路のみ）。
 */

/** テーブル / 関数が未作成（マイグレーション未適用）を表す PostgREST のコード */
const MISSING_CODES = new Set(["PGRST202", "PGRST205"]);

export type AdminStudentsBundle = {
  rows: StudentRow[];
  /** 一覧に出せるコース（受講権限の付与候補でもある） */
  courses: AdminCourse[];
  /** migration 未適用など、取得できなかった場合の理由 */
  unavailable: string | null;
};

async function loadStudents(): Promise<AdminStudentsBundle> {
  const [supabase, content] = await Promise.all([createClient(), getContentBundle()]);

  const courses: AdminCourse[] = content.snapshot.courses.map((course) => ({
    id: course.id,
    title: course.title,
    lessonCount: course.totalLessons,
  }));

  const usersResult = await supabase.rpc("admin_list_students");

  if (usersResult.error) {
    if (usersResult.error.code && MISSING_CODES.has(usersResult.error.code)) {
      return {
        rows: [],
        courses,
        unavailable:
          "受講生取得用の関数がまだ作成されていません（migration 未適用）。",
      };
    }
    throw new Error(
      `[admin] 受講生の取得に失敗しました: ${usersResult.error.message}`,
    );
  }

  const [enrollmentsResult, progressResult] = await Promise.all([
    supabase.from("user_course_enrollments").select("user_id, course_id, expires_at"),
    supabase.from("lesson_progress").select("user_id, lesson_id, status, last_viewed_at"),
  ]);

  if (enrollmentsResult.error) {
    throw new Error(
      `[admin] 受講権限の取得に失敗しました: ${enrollmentsResult.error.message}`,
    );
  }
  if (progressResult.error) {
    throw new Error(
      `[admin] 学習進捗の取得に失敗しました: ${progressResult.error.message}`,
    );
  }

  const users: AdminUserRecord[] = (usersResult.data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    invitedAt: row.invited_at,
    bannedUntil: row.banned_until,
  }));

  // 受講権限もレッスンも DB では uuid。表示と付与は slug で扱うため写す。
  const enrollments: AdminEnrollmentRecord[] = [];
  for (const row of enrollmentsResult.data ?? []) {
    const slug = content.ids.courseSlugByUuid.get(row.course_id);
    if (!slug) continue;
    enrollments.push({
      userId: row.user_id,
      courseId: slug,
      expiresAt: row.expires_at,
    });
  }

  const progress: AdminProgressRecord[] = [];
  for (const row of progressResult.data ?? []) {
    const slug = content.ids.lessonSlugByUuid.get(row.lesson_id);
    if (!slug) continue;
    progress.push({
      userId: row.user_id,
      lessonId: slug,
      completed: row.status === "completed",
      lastViewedAt: row.last_viewed_at,
    });
  }

  return {
    rows: buildStudentRows({ users, enrollments, progress, courses }),
    courses,
    unavailable: null,
  };
}

/** 同一リクエスト内では 1 回しか実行されない */
export const getAdminStudents = cache(loadStudents);

/** 受講生 1 人分。一覧を引いてから絞る（人数規模的にこれで十分） */
export async function getAdminStudent(
  userId: string,
): Promise<StudentRow | null> {
  const { rows } = await getAdminStudents();
  return rows.find((row) => row.id === userId) ?? null;
}
