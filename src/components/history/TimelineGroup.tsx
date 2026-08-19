/**
 * 学習履歴の日付グルーピング（タイムライン UI）。
 *
 * 学習履歴.dc.html の実値:
 *   見出し … 10px の青ドット（box-shadow:0 0 0 4px #DCEAFB のリング）+ ラベル
 *            + 件数 + 横罫線
 *   配下   … border-left:2px solid #E6EEFA + padding-left:22px の縦レール
 *
 * Mobile も同じ構造のまま、余白だけ縮める（PC 22px → 14px）。
 */
export function TimelineGroup({
  label,
  count,
  variant,
  children,
}: {
  label: string;
  count: number;
  variant: "pc" | "mobile";
  children: React.ReactNode;
}) {
  const pc = variant === "pc";

  return (
    <div className={`flex flex-col ${pc ? "gap-3" : "gap-2.5"}`}>
      <div className={`flex items-center pt-1 ${pc ? "gap-3" : "gap-2.5"}`}>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand shadow-ring" />
        <span
          className={`font-rounded font-bold text-ink ${pc ? "text-15" : "text-14"}`}
        >
          {label}
        </span>
        <span className={`text-ink4 ${pc ? "text-125" : "text-115"}`}>
          {count}本
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div
        className={`ml-1 flex flex-col border-l-2 border-line ${
          pc ? "gap-3 pl-[22px]" : "gap-2.5 pl-3.5"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
