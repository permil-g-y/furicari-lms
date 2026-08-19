"use client";

import { SearchGlyph } from "./Icon";

/**
 * カテゴリチップ。
 * PC は折り返しの横並び、Mobile は横スクロール帯（Claude Design の実装に合わせる）。
 */
/**
 * Reference のチップは高さごとに左右 padding が決まっている。
 * h40 → 20px（コース一覧） / h38 → 18px（お気に入り・お知らせ） / h30 → 12px（動画一覧サイドバー）
 */
function defaultChipPadding(height: number): number {
  if (height >= 40) return 20;
  if (height >= 36) return 18;
  return 12;
}

export function CategoryChips<T extends string>({
  items,
  value,
  onChange,
  height = 40,
  fontSize = 13.5,
  paddingX,
  /** 非アクティブのウェイト。Reference は基本 normal、コース一覧のみ medium */
  inactiveWeight = "normal",
  /** アクティブチップの影。動画一覧サイドバーの h30 チップだけ影なし */
  activeShadow = true,
  /** 未選択時の背景。動画一覧サイドバーだけ #F4F8FF */
  inactiveBg = "surface",
  scrollOnMobile = false,
  className = "",
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  height?: number;
  fontSize?: number;
  paddingX?: number;
  inactiveWeight?: "normal" | "medium";
  activeShadow?: boolean;
  inactiveBg?: "surface" | "page";
  /** true にすると Mobile 幅で横スクロール帯になる */
  scrollOnMobile?: boolean;
  className?: string;
}) {
  const px = paddingX ?? defaultChipPadding(height);

  return (
    <div
      className={`flex items-center gap-2.5 ${
        scrollOnMobile
          ? "no-scrollbar overflow-x-auto lg:flex-wrap lg:overflow-visible"
          : "flex-wrap"
      } ${className}`}
    >
      {items.map((item) => {
        const on = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full transition-colors ${
              on
                ? `bg-brand font-bold text-white ${activeShadow ? "shadow-btn-sm" : ""}`
                : `border border-line ${
                    inactiveBg === "page" ? "bg-page" : "bg-surface"
                  } ${
                    inactiveWeight === "medium" ? "font-medium" : "font-normal"
                  } text-ink2 hover:border-brand-tint2 hover:bg-brand-tint hover:text-brand-deep`
            }`}
            style={{ height, fontSize, paddingInline: px }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** 検索ボックス（完全ピル・CSS 図形の虫眼鏡） */
export function SearchBox({
  value,
  onChange,
  placeholder,
  height = 52,
  fontSize = 14,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  height?: number;
  fontSize?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-full border border-line bg-surface px-5 focus-within:border-brand-tint2 ${className}`}
      style={{ height }}
    >
      <SearchGlyph size={15} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink4"
        style={{ fontSize }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="検索をクリア"
          className="cursor-pointer text-13 text-ink4 hover:text-brand-deep"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/** 並び替えドロップダウン（見た目は Claude Design のピル、中身は select） */
export function SortSelect<T extends string>({
  value,
  onChange,
  options,
  label = "並び替え",
  height = 52,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { key: T; label: string }[];
  label?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface pl-5 pr-4 ${className}`}
      style={{ height }}
    >
      <span className="whitespace-nowrap text-125 text-ink4">{label}</span>
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="cursor-pointer appearance-none bg-transparent pr-5 text-135 font-medium text-ink-sub outline-none"
        >
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-0"
          style={{
            width: 0,
            height: 0,
            borderLeft: "4.5px solid transparent",
            borderRight: "4.5px solid transparent",
            borderTop: "5px solid #9BB1CC",
          }}
        />
      </div>
    </div>
  );
}

/** ページネーション（丸 40px） */
export function Pagination({
  page,
  totalPages,
  onChange,
  className = "",
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const base =
    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-135 transition-colors";

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        aria-label="前のページ"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${base} border border-line bg-surface text-ink3 hover:bg-brand-tint hover:text-brand-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-ink3`}
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`${base} ${
            p === page
              ? "bg-brand font-bold text-white shadow-btn-sm"
              : "border border-line bg-surface text-ink2 hover:bg-brand-tint hover:text-brand-deep"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="次のページ"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className={`${base} border border-line bg-surface text-ink3 hover:bg-brand-tint hover:text-brand-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-ink3`}
      >
        ›
      </button>
    </div>
  );
}
