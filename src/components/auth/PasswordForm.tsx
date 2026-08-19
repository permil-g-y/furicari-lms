"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Icon";
import {
  AuthHeading,
  FormMessage,
  authFieldClass,
  authFormClass,
  authInputClass,
  authLabelClass,
} from "./AuthShell";
import { updatePasswordAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/state";

/**
 * パスワード設定フォーム。
 * 招待後の「初回パスワード設定」と「パスワード再設定」で共用する。
 */
export function PasswordForm({
  title,
  description,
  submitLabel,
  email,
  askDisplayName = false,
  displayNamePlaceholder,
}: {
  title: string;
  description: string;
  submitLabel: string;
  /** 確認用に表示するログイン中のメールアドレス */
  email?: string;
  /** 初回設定時のみ、表示名も任意入力できるようにする */
  askDisplayName?: boolean;
  displayNamePlaceholder?: string;
}) {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialAuthState,
  );
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className={authFormClass}>
      <Logo
        className="hidden self-start lg:block"
        style={{ height: "auto", width: 300 }}
      />

      <AuthHeading title={title} description={description} />

      <div className="flex flex-col gap-4 lg:gap-5">
        <FormMessage status={state.status} message={state.message} />

        {email && (
          <div className="flex flex-col gap-2 lg:gap-[9px]">
            <span className={authLabelClass}>メールアドレス</span>
            <span className={`${authFieldClass} text-14 text-ink4 lg:text-145`}>
              {email}
            </span>
          </div>
        )}

        {askDisplayName && (
          <label className="flex flex-col gap-2 lg:gap-[9px]">
            <span className={authLabelClass}>表示名（任意・あとから変更できます）</span>
            <span className={authFieldClass}>
              <input
                type="text"
                name="displayName"
                autoComplete="nickname"
                placeholder={displayNamePlaceholder ?? "例：ゆうき"}
                className={authInputClass}
              />
            </span>
          </label>
        )}

        <label className="flex flex-col gap-2 lg:gap-[9px]">
          <span className={authLabelClass}>新しいパスワード（8文字以上）</span>
          <span className={authFieldClass}>
            <input
              type={show ? "text" : "password"}
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="パスワード"
              className={authInputClass}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="shrink-0 cursor-pointer text-125 font-bold text-brand-deep hover:text-brand-deeper"
            >
              {show ? "隠す" : "表示"}
            </button>
          </span>
        </label>

        <label className="flex flex-col gap-2 lg:gap-[9px]">
          <span className={authLabelClass}>新しいパスワード（確認）</span>
          <span className={authFieldClass}>
            <input
              type={show ? "text" : "password"}
              name="passwordConfirmation"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="もう一度入力してください"
              className={authInputClass}
            />
          </span>
        </label>
      </div>

      <Button type="submit" size={56} block>
        {pending ? "設定中..." : submitLabel}
      </Button>
    </form>
  );
}
