"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/auth/actions";
import {
  updateDisplayName,
  updateNotificationEnabled,
} from "@/lib/auth/profile-actions";

/**
 * アカウント設定のリスト（Claude Design の renderVals の 4 行）。
 *
 * ■ Phase 6-D で実データになったもの
 *   - 表示名   … その場で編集して profiles.display_name に保存する
 *   - 通知設定 … その場で切り替えて profiles.notification_enabled に保存する
 *
 * ■ 変えていないもの
 *   - メールアドレスは表示のみ（変更には確認メールの仕組みが要るため対象外）
 *   - パスワード変更は既存の /password-reset への導線をそのまま使う。
 *     「最終更新日」は取得元が無くダミーだったので表示自体をやめた
 *   - 行の構造・余白・文字サイズ・配色は Phase 1 のまま
 */

/** 行の共通シェル。中身だけ差し替えて見た目を揃える */
function SettingRow({
  title,
  desc,
  divider,
  children,
}: {
  title: string;
  desc: string;
  divider: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 lg:px-6 lg:py-[22px] ${
        divider ? "border-t border-surface-alt" : ""
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-14 font-bold text-ink lg:text-15">{title}</span>
        <span className="text-12 text-ink4 lg:text-125">{desc}</span>
      </div>
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

/** 右端に出す現在値 */
function RowValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-[220px] truncate text-125 text-ink3 lg:max-w-[280px] lg:text-13">
      {children}
    </span>
  );
}

export function AccountSettings({
  displayName,
  email,
  notificationEnabled,
}: {
  displayName: string;
  email: string;
  notificationEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  /* ---- 表示名 -------------------------------------------------------- */
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [name, setName] = useState(displayName);
  const [nameError, setNameError] = useState(false);

  function saveName(event: React.FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (next.length === 0) {
      setNameError(true);
      return;
    }
    const previous = name;
    setName(next);
    setEditing(false);
    setNameError(false);
    startTransition(async () => {
      const result = await updateDisplayName(next);
      if (!result.ok) {
        // 保存できなかったので表示を元に戻す
        setName(previous);
        setNameError(true);
      }
    });
  }

  function startEditing() {
    setDraft(name);
    setNameError(false);
    setEditing(true);
  }

  /* ---- 通知設定 ------------------------------------------------------ */
  const [notify, setNotify] = useState(notificationEnabled);

  function toggleNotify() {
    const next = !notify;
    setNotify(next);
    startTransition(async () => {
      const result = await updateNotificationEnabled(next);
      if (!result.ok) setNotify(!next);
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {/* ---- 表示名 ---- */}
      <SettingRow
        title="プロフィール編集"
        desc={nameError ? "保存できませんでした。もう一度お試しください。" : "表示名を変更できます"}
        divider={false}
      >
        {editing ? (
          <form onSubmit={saveName} className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={40}
              aria-label="表示名"
              autoFocus
              className="h-10 w-[150px] rounded-full border border-line bg-page px-4 text-125 text-ink outline-none focus:border-brand-tint2 lg:w-[200px] lg:text-13"
            />
            <button
              type="submit"
              className="flex h-10 shrink-0 cursor-pointer items-center rounded-full bg-brand px-4 text-125 font-bold text-white transition-colors hover:bg-brand-deep"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-10 shrink-0 cursor-pointer items-center rounded-full px-2 text-125 text-ink3 transition-colors hover:text-ink"
            >
              やめる
            </button>
          </form>
        ) : (
          <>
            <RowValue>{name}</RowValue>
            <button
              type="button"
              onClick={startEditing}
              className="flex h-10 shrink-0 cursor-pointer items-center rounded-full border border-brand-tint2 bg-surface px-4 text-125 font-bold text-brand-deep transition-colors hover:bg-brand-tint"
            >
              変更
            </button>
          </>
        )}
      </SettingRow>

      {/* ---- メールアドレス（表示のみ） ---- */}
      <SettingRow
        title="メールアドレス"
        desc="ログインと通知の受け取りに使用します"
        divider
      >
        <RowValue>{email}</RowValue>
      </SettingRow>

      {/* ---- パスワード変更（既存導線を維持） ---- */}
      <SettingRow
        title="パスワード変更"
        desc="登録済みのメールアドレスに再設定用のリンクを送ります"
        divider
      >
        <Link
          href="/password-reset"
          className="flex h-10 shrink-0 items-center rounded-full border border-brand-tint2 bg-surface px-4 text-125 font-bold text-brand-deep transition-colors hover:bg-brand-tint"
        >
          変更する
        </Link>
      </SettingRow>

      {/* ---- 通知設定 ---- */}
      <SettingRow
        title="通知設定"
        desc="新着コース・お知らせのメール通知"
        divider
      >
        <RowValue>{notify ? "オン" : "オフ"}</RowValue>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          aria-label="メール通知"
          onClick={toggleNotify}
          className={`relative h-7 w-[52px] shrink-0 cursor-pointer rounded-full transition-colors ${
            notify ? "bg-brand" : "bg-line"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow-card transition-all ${
              notify ? "left-[26px]" : "left-1"
            }`}
          />
        </button>
      </SettingRow>

      <div className="border-t border-surface-alt p-4 lg:px-6 lg:py-5">
        <Button
          variant="danger"
          size={46}
          onClick={() => startTransition(() => void signOutAction())}
          className="w-full lg:w-auto"
        >
          {pending ? "処理中..." : "ログアウト"}
        </Button>
      </div>
    </div>
  );
}
