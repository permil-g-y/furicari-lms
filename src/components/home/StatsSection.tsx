import { Icon, type IconName } from "@/components/ui/Icon";
import { learningStats } from "@/lib/mock";
import { splitAmount } from "./util";

type StatItem = {
  label: string;
  /** "32本" / "14時間20分" のように単位まで含めた文字列 */
  amount: string;
  icon: IconName;
  iconSize: number;
  /** Mobile 版のアイコンサイズ */
  iconSizeSm: number;
  bg: string;
};

/** PC は 4 枚。Mobile（今週の学習）は「受講中コース」を除いた 3 枚。 */
const items: StatItem[] = [
  {
    label: "学習済み動画",
    amount: `${learningStats.completedLessons}本`,
    icon: "icon-film",
    iconSize: 22,
    iconSizeSm: 19,
    bg: "var(--color-brand-tint)",
  },
  {
    label: "総学習時間",
    amount: learningStats.totalWatchTimeLabel,
    icon: "icon-cloud",
    iconSize: 24,
    iconSizeSm: 20,
    bg: "var(--color-brand-tint)",
  },
  {
    label: "受講中コース",
    amount: `${learningStats.activeCourses}コース`,
    icon: "icon-book",
    iconSize: 22,
    iconSizeSm: 19,
    bg: "var(--color-brand-tint)",
  },
  {
    label: "連続学習日数",
    amount: `${learningStats.streakDays}日`,
    icon: "icon-medal",
    iconSize: 22,
    iconSizeSm: 19,
    bg: "var(--color-pink-bg2)",
  },
];

const mobileItems = items.filter((i) => i.label !== "受講中コース");

/** 数字は font-rounded の大きい文字、単位は小さいグレー文字 */
function Amount({
  text,
  size,
  unitSize,
  unitGap,
}: {
  text: string;
  size: number;
  unitSize: number;
  unitGap: number;
}) {
  const parts = splitAmount(text);
  return (
    <span className="font-rounded font-bold text-ink" style={{ fontSize: size }}>
      {parts.map((part, i) =>
        /^\d+$/.test(part) ? (
          <span key={i}>{part}</span>
        ) : (
          <span
            key={i}
            className="font-medium text-ink3"
            style={{
              fontSize: unitSize,
              marginLeft: unitGap,
              marginRight: i === parts.length - 1 ? 0 : unitGap,
            }}
          >
            {part}
          </span>
        ),
      )}
    </span>
  );
}

/**
 * 学習サマリー。
 * PC は 4 カラムのグリッド、Mobile は「今週の学習」の横スクロールカルーセル（3 枚）。
 */
export function StatsSection() {
  return (
    <>
      {/* ---- Mobile ---- */}
      <section className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-2 px-4">
          <Icon name="icon-sparkle-cluster" size={20} />
          <h2 className="font-rounded text-16 font-bold text-ink">今週の学習</h2>
        </div>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1">
          {mobileItems.map((item) => (
            <div
              key={item.label}
              className="flex min-w-[132px] flex-col gap-2.5 rounded-18 border border-line bg-surface p-4 shadow-card"
            >
              <span
                className="flex size-[34px] items-center justify-center rounded-11"
                style={{ background: item.bg }}
              >
                <Icon name={item.icon} size={item.iconSizeSm} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-115 text-ink3">{item.label}</span>
                <Amount text={item.amount} size={22} unitSize={12} unitGap={3} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- PC ---- */}
      <section className="hidden gap-5 lg:grid lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-3.5 rounded-card border border-line bg-surface p-6 shadow-card"
          >
            <span
              className="flex size-10 items-center justify-center rounded-12"
              style={{ background: item.bg }}
            >
              <Icon name={item.icon} size={item.iconSize} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-125 font-medium text-ink3">{item.label}</span>
              <Amount text={item.amount} size={26} unitSize={14} unitGap={4} />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
