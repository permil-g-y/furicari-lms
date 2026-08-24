/**
 * 招待の入力検証と結果の解釈。
 *
 * 純粋関数だけを置く。招待は「取り消せない副作用」なので、
 * どういう入力を弾き、どういう結果をどう伝えるかをテストで固定しておきたい。
 */

/**
 * メールアドレスの形。
 *
 * 厳密な RFC 準拠は目指さない（現実のアドレスを弾く事故のほうが多い）。
 * ここで防ぎたいのは「空欄」「スペースだけ」「@ の無い入力」といった
 * 明らかな打ち間違いで招待メールを無駄撃ちすることだけ。
 * 本当に届くかどうかは送ってみないと分からない。
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function validateEmail(input: string): { ok: true; email: string } | { ok: false; message: string } {
  const email = normalizeEmail(input);
  if (!email) return { ok: false, message: "メールアドレスを入力してください。" };
  if (!EMAIL_SHAPE.test(email)) {
    return { ok: false, message: "メールアドレスの形式が正しくありません。" };
  }
  return { ok: true, email };
}

/** 招待の結果 */
export type InviteOutcome = {
  /**
   * invited          … 新規に招待メールを送った
   * existing_granted … 既に登録済みだったので、招待はせず権限だけ付けた
   */
  kind: "invited" | "existing_granted";
  userId: string;
  email: string;
  grantedCourses: string[];
  /** 付与に失敗したコース。招待は成功しているので、ここが空でなくても ok は true */
  failedCourses: string[];
};

/**
 * 結果を運営向けの文章にする。
 *
 * ■ 部分失敗を「成功」で塗りつぶさない
 *   招待メールは取り消せない。「招待は成功したが権限付与に失敗した」ときに
 *   ただの成功と表示すると、運営は付与済みだと思い込み、受講生は何も見られない。
 *   その状態は一覧で「招待済み・権限未設定」として拾えるので、
 *   ここでは何が起きたかをそのまま伝える。
 */
export function describeOutcome(outcome: InviteOutcome): {
  tone: "success" | "warning";
  message: string;
} {
  const granted = outcome.grantedCourses.length;
  const failed = outcome.failedCourses.length;

  if (failed > 0) {
    const base =
      outcome.kind === "invited"
        ? `${outcome.email} へ招待メールを送りました。`
        : `${outcome.email} は登録済みのため、権限のみ設定しました。`;
    return {
      tone: "warning",
      message:
        `${base}ただし ${outcome.failedCourses.join("・")} の受講権限を付与できませんでした。` +
        "受講生の詳細画面から付与し直してください。",
    };
  }

  if (outcome.kind === "existing_granted") {
    return {
      tone: "success",
      message:
        granted > 0
          ? `${outcome.email} は既に登録済みでした。${granted} コースの受講権限を設定しました。`
          : `${outcome.email} は既に登録済みです。受講権限は変更していません。`,
    };
  }

  return {
    tone: "success",
    message:
      granted > 0
        ? `${outcome.email} へ招待メールを送り、${granted} コースの受講権限を設定しました。`
        : `${outcome.email} へ招待メールを送りました。受講権限はまだ設定されていません。`,
  };
}
