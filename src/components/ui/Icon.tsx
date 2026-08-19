/* eslint-disable @next/next/no-img-element */

/**
 * 正式アイコン（素材/icon/svg の 10 点）を表示する。
 * SVG 側で色がハードコードされているため、色替えはせずサイズのみ指定する。
 */
export type IconName =
  | "icon-book"
  | "icon-chat"
  | "icon-cloud"
  | "icon-film"
  | "icon-heart"
  | "icon-medal"
  | "icon-sparkle-cluster"
  | "icon-sparkle-duo"
  | "icon-user"
  | "icon-video";

export function Icon({
  name,
  size = 20,
  alt = "",
  className = "",
  style,
}: {
  name: IconName | string;
  size?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={`block shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}

/** フリキャリ ロゴ */
export function Logo({
  height = 34,
  className = "",
  style,
}: {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src="/logo.png"
      alt="フリキャリ"
      className={`block w-auto ${className}`}
      style={{ height, ...style }}
    />
  );
}

/**
 * 検索アイコン。Claude Design では画像ではなく CSS 図形で描かれているため、
 * 同じ見た目を border で再現する。
 */
export function SearchGlyph({
  size = 15,
  color = "#9BB1CC",
  thickness = 2,
}: {
  size?: number;
  color?: string;
  thickness?: number;
}) {
  return (
    <span
      className="relative block shrink-0 rounded-full"
      style={{ width: size, height: size, border: `${thickness}px solid ${color}` }}
    >
      <span
        className="absolute block rounded-[2px]"
        style={{
          right: -(size / 3),
          bottom: -(size / 3.75),
          width: size / 2.14,
          height: thickness,
          background: color,
          transform: "rotate(45deg)",
        }}
      />
    </span>
  );
}
