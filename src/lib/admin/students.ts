import type { UserRole } from "@/lib/supabase/database.types";
import { isEnrollmentActive } from "@/lib/enrollment/access";

/**
 * 受講生一覧の組み立て。
 *
 * ここは **純粋関数だけ** にしてある。
 * 受講状態の解釈（誰が「要対応」なのか）は運営判断に直結するため、
 * DB や Supabase を持ち込まずテストで固定できる形にしておきたい。
 */

/** アカウントの状態 */
export type AccountState =
  /** 招待メールは送ったが、まだ一度もログインしていない */
  | "invited"
  /** ログイン実績がある */
  | "active"
  /** 管理者により停止されている */
  | "banned";

/** 受講権限の状態 */
export type EnrollmentState =
  /** 有効な受講権限が 1 件以上ある */
  | "enrolled"
  /** 受講権限はあるが、すべて期限切れ */
  | "expired"
  /** 受講権限が 1 件も無い */
  | "none";

export type StudentEnrollment = {
  courseId: string;
  courseTitle: string;
  /** null は無期限 */
  expiresAt: string | null;
  active: boolean;
};

export type StudentRow = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  account: AccountState;
  enrollment: EnrollmentState;
  enrollments: StudentEnrollment[];
  createdAt: string;
  lastSignInAt: string | null;
  /** 最後に動画を見た日時。一度も見ていなければ null */
  lastViewedAt: string | null;
  completedLessons: number;
  /** 有効な受講権限があるコースの総レッスン数 */
  totalLessons: number;
  /**
   * 運営が対応すべき状態か。
   * 「招待したのに権限を付け忘れている」を拾うのが主目的
   * （招待と権限付与を別作業にすると必ず起きる）。
   */
  needsAttention: boolean;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  lastSignInAt: string | null;
  invitedAt: string | null;
  bannedUntil: string | null;
};

export type AdminEnrollmentRecord = {
  userId: string;
  courseId: string;
  expiresAt: string | null;
};

export type AdminProgressRecord = {
  userId: string;
  lessonId: string;
  completed: boolean;
  lastViewedAt: string;
};

export type AdminCourse = {
  id: string;
  title: string;
  lessonCount: number;
};

export function resolveAccountState(
  user: Pick<AdminUserRecord, "lastSignInAt" | "bannedUntil">,
  now: Date,
): AccountState {
  if (user.bannedUntil) {
    const until = Date.parse(user.bannedUntil);
    // 解釈できない値は「停止されている」側に倒す（安全側）
    if (Number.isNaN(until) || until > now.getTime()) return "banned";
  }
  return user.lastSignInAt ? "active" : "invited";
}

export function resolveEnrollmentState(
  enrollments: readonly StudentEnrollment[],
): EnrollmentState {
  if (enrollments.length === 0) return "none";
  return enrollments.some((e) => e.active) ? "enrolled" : "expired";
}

/**
 * 「要対応」の定義。
 *
 * 有効な受講権限が無い人は、理由が招待直後でも期限切れでも
 * 「いま何も見られない」状態なので、まとめて拾う。
 * 停止中は運営が意図してそうしているので対象外。
 */
export function needsAttention(row: {
  account: AccountState;
  enrollment: EnrollmentState;
}): boolean {
  if (row.account === "banned") return false;
  return row.enrollment !== "enrolled";
}

export function buildStudentRows(input: {
  users: readonly AdminUserRecord[];
  enrollments: readonly AdminEnrollmentRecord[];
  progress: readonly AdminProgressRecord[];
  courses: readonly AdminCourse[];
  now?: Date;
}): StudentRow[] {
  const now = input.now ?? new Date();
  const courseById = new Map(input.courses.map((c) => [c.id, c]));

  const enrollmentsByUser = new Map<string, StudentEnrollment[]>();
  for (const record of input.enrollments) {
    const course = courseById.get(record.courseId);
    // 非公開コースなど、一覧に載っていないコースの権限は表示しない
    if (!course) continue;
    const list = enrollmentsByUser.get(record.userId) ?? [];
    list.push({
      courseId: record.courseId,
      courseTitle: course.title,
      expiresAt: record.expiresAt,
      active: isEnrollmentActive(record.expiresAt, now),
    });
    enrollmentsByUser.set(record.userId, list);
  }

  const completedByUser = new Map<string, number>();
  const lastViewedByUser = new Map<string, string>();
  for (const record of input.progress) {
    if (record.completed) {
      completedByUser.set(
        record.userId,
        (completedByUser.get(record.userId) ?? 0) + 1,
      );
    }
    const current = lastViewedByUser.get(record.userId);
    if (!current || record.lastViewedAt > current) {
      lastViewedByUser.set(record.userId, record.lastViewedAt);
    }
  }

  return input.users.map((user) => {
    const enrollments = (enrollmentsByUser.get(user.id) ?? []).sort((a, b) =>
      a.courseTitle.localeCompare(b.courseTitle, "ja"),
    );
    const account = resolveAccountState(user, now);
    const enrollment = resolveEnrollmentState(enrollments);

    const totalLessons = enrollments
      .filter((e) => e.active)
      .reduce((sum, e) => sum + (courseById.get(e.courseId)?.lessonCount ?? 0), 0);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName?.trim() || user.email.split("@")[0] || "受講生",
      role: user.role,
      account,
      enrollment,
      enrollments,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      lastViewedAt: lastViewedByUser.get(user.id) ?? null,
      completedLessons: completedByUser.get(user.id) ?? 0,
      totalLessons,
      needsAttention: needsAttention({ account, enrollment }),
    };
  });
}

/** 一覧の絞り込み（名前・メールの部分一致） */
export function filterStudents(
  rows: readonly StudentRow[],
  query: string,
): StudentRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter(
    (row) =>
      row.displayName.toLowerCase().includes(needle) ||
      row.email.toLowerCase().includes(needle),
  );
}
