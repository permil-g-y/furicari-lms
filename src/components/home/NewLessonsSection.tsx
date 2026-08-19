import Link from "next/link";
import { PlayTriangle } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import { FavoriteHeart } from "@/components/video/VideoCard";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { getLessons, levelLabel, newLessonIds, tools } from "@/lib/mock";
import { formatDate, isNewLesson } from "./util";

/**
 * 新着動画（PC のみ。Claude Design の Mobile 版にはこのセクションが無い）。
 * 進捗オーバーレイは付けず、NEW バッジと公開日・お気に入りを出す。
 */
export function NewLessonsSection() {
  const lessons = getLessons(newLessonIds);

  return (
    <section className="hidden flex-col gap-5 lg:flex">
      <SectionHeading
        icon="icon-sparkle-cluster"
        title="新着動画"
        action={{ label: "動画一覧へ", href: "/videos" }}
      />

      <div className="grid grid-cols-4 gap-6">
        {lessons.map((lesson) => (
          <article
            key={lesson.id}
            className="overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all hover:border-brand-tint3 hover:shadow-card-hover"
          >
            <Link href={`/watch/${lesson.id}`} className="block">
              <VideoThumbnail
                tool={lesson.tool}
                durationSeconds={lesson.durationSeconds}
                scale="md"
                showPlay={false}
              >
                {isNewLesson(lesson.publishedAt) && (
                  <span
                    className="absolute right-2.5 top-2.5 flex items-center rounded-6 bg-alert text-105 font-bold tracking-[.06em] text-white"
                    style={{ height: 22, paddingInline: 8 }}
                  >
                    NEW
                  </span>
                )}
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 42, height: 42, background: "rgba(255,255,255,.9)" }}
                >
                  <PlayTriangle size={12} color={tools[lesson.tool].ink} />
                </span>
              </VideoThumbnail>
            </Link>

            <div className="flex flex-col gap-[9px] px-[18px] pb-[18px] pt-4">
              <Link
                href={`/watch/${lesson.id}`}
                className="text-15 font-bold leading-[1.55] text-ink hover:text-brand-deep"
              >
                {lesson.title}
              </Link>
              <div className="flex items-center gap-2">
                <Tag tone="brand" height={22} paddingX={8} fontSize={11}>
                  {levelLabel(lesson.level)}
                </Tag>
                <span className="text-115 text-ink4">{formatDate(lesson.publishedAt)}</span>
                <FavoriteHeart lessonId={lesson.id} size={18} className="ml-auto" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
