import Link from "next/link";

/**
 * ボタン。Claude Design 内に出現する高さをそのまま size として持たせている。
 * 角丸はすべてピル（999px）、影は青系のみ。新しい variant を足さないこと。
 */
export type ButtonVariant =
  | "primary" // #3B90F5 塗り
  | "outline" // 白地 + #E6EEFA 枠
  | "outline-brand" // 白地 + #BFDCFA 枠 + #2C7BE0 文字（準ボタン）
  | "soft" // #EAF4FF 面 + #2C7BE0 文字
  | "danger"; // ログアウト（白地 + #F0C4BD 枠 + #D9705F 文字）

export type ButtonSize = 38 | 40 | 44 | 46 | 48 | 52 | 54 | 56;

const sizeStyle: Record<ButtonSize, { padding: number; fontSize: number; shadow: string }> = {
  38: { padding: 18, fontSize: 13.5, shadow: "var(--shadow-btn-sm)" },
  40: { padding: 18, fontSize: 13.5, shadow: "var(--shadow-btn-sm)" },
  44: { padding: 20, fontSize: 14, shadow: "var(--shadow-btn-sm)" },
  46: { padding: 22, fontSize: 14, shadow: "var(--shadow-btn)" },
  48: { padding: 24, fontSize: 15, shadow: "var(--shadow-btn)" },
  52: { padding: 26, fontSize: 15.5, shadow: "var(--shadow-btn-lg)" },
  54: { padding: 30, fontSize: 16, shadow: "var(--shadow-btn-lg)" },
  56: { padding: 34, fontSize: 17, shadow: "var(--shadow-btn-xl)" },
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  outline:
    "bg-surface text-ink-sub border border-line hover:bg-brand-tint hover:text-brand-deep hover:border-brand-tint2",
  "outline-brand":
    "bg-surface text-brand-deep border border-brand-tint2 hover:bg-brand-tint hover:border-brand-tint2",
  soft: "bg-brand-tint text-brand-deep hover:bg-brand-tint2",
  danger:
    "bg-surface text-danger border border-danger-line hover:bg-pink-bg2",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 横幅いっぱいに広げる */
  block?: boolean;
  /** 影を消す（アウトライン系は Claude Design 上でも影なし） */
  shadow?: boolean;
  /** size 既定のフォントサイズを上書きする（Reference と 0.5px 単位で合わせる用） */
  fontSize?: number;
  /** 左右 padding を上書きする */
  paddingX?: number;
  /** 書体。Reference のアウトライン系 CTA は本文書体のことがある */
  font?: "rounded" | "sans";
  /** 角丸。Reference が矩形寄りのボタンのとき px 指定する */
  radius?: number | "full";
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & { href: string; onClick?: never; type?: never };
type ButtonAsButton = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const {
    variant = "primary",
    size = 48,
    block = false,
    shadow,
    fontSize,
    paddingX,
    font = "rounded",
    radius = "full",
    style: styleOverride,
    className = "",
    children,
  } = props;

  const s = sizeStyle[size];
  const withShadow = shadow ?? variant === "primary";

  const classes = [
    "inline-flex items-center justify-center gap-2.5 font-bold",
    font === "rounded" ? "font-rounded" : "font-sans",
    "cursor-pointer transition-colors whitespace-nowrap",
    variantClass[variant],
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: React.CSSProperties = {
    height: size,
    paddingInline: paddingX ?? (block ? undefined : s.padding),
    fontSize: fontSize ?? s.fontSize,
    borderRadius: radius === "full" ? 9999 : radius,
    boxShadow: withShadow ? s.shadow : undefined,
    ...styleOverride,
  };

  if (props.href) {
    return (
      <Link href={props.href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={classes}
      style={style}
    >
      {children}
    </button>
  );
}

/** 再生アイコン（CSS 三角形。Claude Design は画像を使っていない） */
export function PlayTriangle({
  size = 13,
  color = "#fff",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`block ${className}`}
      style={{
        width: 0,
        height: 0,
        borderTop: `${size * 0.615}px solid transparent`,
        borderBottom: `${size * 0.615}px solid transparent`,
        borderLeft: `${size}px solid ${color}`,
        marginLeft: size * 0.15,
      }}
    />
  );
}
