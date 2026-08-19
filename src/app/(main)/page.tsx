import { CurrentCourseSection } from "@/components/home/CurrentCourseSection";
import { HeroSection } from "@/components/home/HeroSection";
import { NewLessonsSection } from "@/components/home/NewLessonsSection";
import { NewsSection } from "@/components/home/NewsSection";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { ResumeSection } from "@/components/home/ResumeSection";
import { StatsSection } from "@/components/home/StatsSection";
import { requireUser } from "@/lib/auth/user";

/**
 * TOP / ホーム。
 * Mobile（< lg）は「今週の学習」「続きから学ぶ」がカルーセル / 横長リストになり、
 * 新着動画セクションは出さない（Claude Design の Mobile 版に合わせている）。
 */
export default async function HomePage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-[600px] flex-col gap-8 px-0 pt-5 lg:max-w-page lg:gap-14 lg:px-10 lg:pb-20 lg:pt-11">
      <HeroSection userName={user.displayName} />
      <CurrentCourseSection />
      <StatsSection />
      <ResumeSection />
      <RecommendedSection />
      <NewLessonsSection />
      <NewsSection />
    </main>
  );
}
