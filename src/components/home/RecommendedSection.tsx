import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import { getCourses, levelLabel, recommendedCourseIds } from "@/lib/mock";
import type { Course } from "@/lib/types";

/** コースカバー（画像ではなくアイコン or 文字 + パステル背景） */
function Cover({
  course,
  height,
  iconSize,
  textSize,
  children,
}: {
  course: Course;
  height: number;
  iconSize: number;
  textSize: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height, background: course.cover.bg }}
    >
      {course.cover.text ? (
        <span
          className="font-rounded font-bold tracking-[.02em]"
          style={{ fontSize: textSize, color: course.cover.textColor }}
        >
          {course.cover.text}
        </span>
      ) : (
        <Icon
          name={course.cover.icon ?? "icon-film"}
          size={course.cover.icon === "icon-medal" ? iconSize - 2 : iconSize}
        />
      )}
      {children}
    </div>
  );
}

/**
 * あなたにおすすめのコース。
 * PC は 4 カラムのグリッド、Mobile は 220px カードの横スクロールカルーセル（2 件）。
 */
export function RecommendedSection() {
  const courses = getCourses(recommendedCourseIds);
  // Claude Design の Mobile 版に出ている 2 件（CapCut 実践 / AI動画編集 効率化）
  const mobileCourses = getCourses(["capcut-practice", "ai-editing"]);

  return (
    <>
      {/* ---- Mobile ---- */}
      <section className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-2 px-4">
          <Icon name="icon-book" size={20} />
          <h2 className="font-rounded text-16 font-bold text-ink">おすすめのコース</h2>
          <Link href="/courses" className="ml-auto text-125 font-medium text-brand-deep">
            すべて 〉
          </Link>
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {mobileCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="flex min-w-[220px] flex-col overflow-hidden rounded-18 border border-line bg-surface shadow-card"
            >
              <Cover course={course} height={88} iconSize={36} textSize={24} />
              <div className="flex flex-col gap-2 px-3.5 pb-4 pt-3.5">
                <span className="font-rounded text-15 font-bold text-ink">{course.title}</span>
                <span className="text-12 leading-[1.65] text-ink3">{course.description}</span>
                <div className="flex flex-wrap gap-[5px]">
                  <Tag height={22} paddingX={8} fontSize={11}>
                    全{course.totalLessons}本
                  </Tag>
                  <Tag tone="brand" height={22} paddingX={8} fontSize={11}>
                    {levelLabel(course.level)}
                  </Tag>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- PC ---- */}
      <section className="hidden flex-col gap-5 lg:flex">
        <SectionHeading
          icon="icon-book"
          title="あなたにおすすめのコース"
          action={{ label: "コース一覧へ", href: "/courses" }}
        />

        <div className="grid grid-cols-4 gap-6">
          {courses.map((course, i) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all hover:border-brand-tint3 hover:shadow-card-hover"
            >
              <Cover course={course} height={118} iconSize={44} textSize={26}>
                <Icon
                  name={i === 1 ? "icon-sparkle-cluster" : "icon-sparkle-duo"}
                  size={18}
                  className="absolute right-4 top-3.5 opacity-85"
                />
              </Cover>

              <div className="flex flex-1 flex-col gap-3 px-[18px] pb-[22px] pt-5">
                <h3 className="font-rounded text-16 font-bold leading-[1.5] text-ink">
                  {course.title}
                </h3>
                <p className="text-125 leading-[1.7] text-ink3">{course.description}</p>

                <div className="mt-auto flex flex-wrap gap-1.5">
                  <Tag>全{course.totalLessons}本</Tag>
                  <Tag>{course.durationLabel}</Tag>
                  <Tag tone="brand">{levelLabel(course.level)}</Tag>
                </div>

                <span className="flex h-11 w-full items-center justify-center rounded-full border border-brand-tint2 bg-surface text-135 font-bold text-brand-deep transition-colors group-hover:bg-brand-tint">
                  詳しく見る
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
