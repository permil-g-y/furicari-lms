/**
 * 受講権限の判定。
 *
 * ■ どこで止めるか
 *   守るべき資産は「動画そのもの」であって、コース名やレッスン名ではない。
 *   そのため教材テーブルの RLS は変更せず、**再生層**で止める。
 *     - コース一覧・コース詳細・カリキュラムは未受講でも見える（ロック表示）
 *     - 動画の再生だけができない
 *     - /watch/[lessonId] の直打ちはサーバー側で拒否し、
 *       Cloudflare の署名トークンを発行する前に判定する
 *
 *   署名なしの Video UID は Cloudflare 側で 401 になることを Phase 4 で実測済みなので、
 *   stream_video_id が読めても再生はできない。
 *
 * ■ この判定はサーバー側でだけ使う
 *   クライアントへ渡るのは「受講中かどうか」の真偽値だけで、
 *   判定そのものはサーバーが行う。
 */

export type EnrollmentAccess = {
  /** 期限内の受講権限があるコース（slug） */
  enrolledCourseIds: ReadonlySet<string>;
  /** 管理者は全コースを閲覧できる */
  isAdmin: boolean;
};

/** そのコースの動画を再生してよいか */
export function canAccessCourse(
  access: EnrollmentAccess,
  courseId: string,
): boolean {
  if (access.isAdmin) return true;
  return access.enrolledCourseIds.has(courseId);
}

/**
 * 受講権限が有効かどうか（期限の解釈）。
 *
 *   expires_at が NULL      → 無期限
 *   expires_at >  現在      → 有効
 *   expires_at <= 現在      → 期限切れ
 */
export function isEnrollmentActive(
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  if (expiresAt === null) return true;
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return false;
  return expires > now.getTime();
}
