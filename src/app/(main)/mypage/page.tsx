/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AccountSettings } from "@/components/mypage/AccountSettings";
import { InProgressCourseCard } from "@/components/mypage/InProgressCourseCard";
import { StatCard, StatUnit } from "@/components/mypage/StatCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { currentUser } from "@/lib/mock";
import { getContent } from "@/lib/content/server";
import { requireUser } from "@/lib/auth/user";

/** 「14時間20分」を 14 / 20 に分解する（分解できない場合はそのまま出す） */
function splitWatchTime(label: string): { hours: string; minutes: string } | null {
  const matched = label.match(/^(\d+)時間(\d+)分$/);
  return matched ? { hours: matched[1], minutes: matched[2] } : null;
}

/** セクション見出し（PC 20px / Mobile 16px） */
function MyPageHeading({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center gap-2 lg:gap-2.5">
      <Icon name={icon} size={20} className="lg:hidden" />
      <Icon name={icon} size={24} className="hidden lg:block" />
      <h2 className="font-rounded text-16 font-bold text-ink lg:text-20">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="ml-auto text-125 font-medium text-brand-deep hover:text-brand-deeper lg:text-135"
        >
          {action.label} 〉
        </Link>
      )}
    </div>
  );
}

export default async function MyPage() {
  const user = await requireUser();
  const content = await getContent();

  const learningStats = content.learningStats;
  const inProgress = content.getInProgressCourses();
  const watchTime = splitWatchTime(learningStats.totalWatchTimeLabel);

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-8 pt-5 pb-2 lg:gap-14 lg:px-10 lg:pt-11 lg:pb-20">
      {/* ------------------------------------------------ プロフィールヒーロー */}
      <section
        className="mx-4 flex flex-col gap-4 rounded-card border border-brand-tint4 p-4 shadow-soft lg:mx-0 lg:flex-row lg:items-center lg:gap-7 lg:rounded-panel lg:p-8"
        style={{ background: "linear-gradient(180deg,#EAF4FF 0%,#FBFDFF 62%)" }}
      >
        <div className="flex items-center gap-3.5 lg:gap-7">
          <span
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-brand-tint4 bg-surface lg:h-24 lg:w-24"
            style={{ boxShadow: "0 4px 12px rgba(59,144,245,.1)" }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <>
                <Icon name={currentUser.avatarIcon} size={40} className="lg:hidden" />
                <Icon
                  name={currentUser.avatarIcon}
                  size={52}
                  className="hidden lg:block"
                />
              </>
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5 lg:gap-2">
            <div className="flex items-center gap-2.5">
              <h1 className="min-w-0 truncate font-rounded text-20 font-bold text-ink lg:text-26">
                {user.displayName}
              </h1>
              <Tag tone="solid" height={26} paddingX={12}>
                受講中
              </Tag>
            </div>
            <span className="truncate text-125 text-ink-sub2 lg:text-14">
              {user.email}
            </span>
            <span className="text-115 text-ink4 lg:text-125">
              {user.joinedLabel} ・ 連続学習{learningStats.streakDays}日目
            </span>
          </div>
        </div>
        <div className="lg:ml-auto">
          <Button size={48} className="w-full lg:w-auto">
            プロフィールを編集
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------- 学習サマリー */}
      <section className="flex flex-col gap-3 lg:gap-5">
        <div className="px-4 lg:px-0">
          <MyPageHeading icon="icon-sparkle-cluster" title="学習サマリー" />
        </div>
        {/* Mobile は TOP - Mobile と同じ横スクロールカルーセル、PC は 4 列グリッド */}
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
          <StatCard icon="icon-film" iconBg="#EAF4FF" label="学習済み動画">
            {learningStats.completedLessons}
            <StatUnit>本</StatUnit>
          </StatCard>
          <StatCard
            icon="icon-cloud"
            iconBg="#EAF4FF"
            iconSize={24}
            mobileIconSize={20}
            label="総学習時間"
          >
            {watchTime ? (
              <>
                {watchTime.hours}
                <StatUnit both>時間</StatUnit>
                {watchTime.minutes}
                <StatUnit>分</StatUnit>
              </>
            ) : (
              learningStats.totalWatchTimeLabel
            )}
          </StatCard>
          <StatCard icon="icon-book" iconBg="#E9F7F1" label="完了コース">
            {learningStats.completedCourses}
            <StatUnit>コース</StatUnit>
          </StatCard>
          <StatCard icon="icon-medal" iconBg="#FFF3F4" label="連続学習日数">
            {learningStats.streakDays}
            <StatUnit>日</StatUnit>
          </StatCard>
        </div>
      </section>

      {/* ------------------------------------------------ 現在学習中のコース */}
      <section className="flex flex-col gap-3 px-4 lg:gap-5 lg:px-0">
        <MyPageHeading
          icon="icon-video"
          title="現在学習中のコース"
          action={{ label: "学習履歴を見る", href: "/history" }}
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
          {inProgress.map((course, i) => (
            <InProgressCourseCard
              key={course.id}
              course={course}
              highlight={i === 0}
            />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- アカウント設定 */}
      <section className="grid grid-cols-1 items-start gap-8 px-4 lg:grid-cols-[1fr_380px] lg:gap-6 lg:px-0">
        <div className="flex flex-col gap-3 lg:gap-5">
          <MyPageHeading icon="icon-user" title="アカウント設定" />
          <AccountSettings
            displayName={user.displayName}
            email={user.email}
            notificationEnabled={user.notificationEnabled}
          />
        </div>

        <div className="flex flex-col gap-3 lg:gap-5">
          <MyPageHeading icon="icon-sparkle-duo" title="次のステップ" />
          <div
            className="flex flex-col items-start gap-3.5 rounded-card border border-brand-tint4 p-5 lg:p-7"
            style={{ background: "linear-gradient(180deg,#EAF4FF,#F7FBFF)" }}
          >
            <h3 className="font-rounded text-16 leading-[1.6] font-bold text-ink lg:text-17">
              次に学ぶコースを
              <br />
              探してみませんか？
            </h3>
            <p className="text-pretty text-125 leading-[1.8] text-ink-sub2 lg:text-13">
              目標やレベルに合わせて、あなたにぴったりのコースを選べます。
            </p>
            <img
              src="/illust/illust-studio.png"
              alt=""
              className="my-0.5 block h-auto w-full"
            />
            <Button href="/courses" size={48} className="w-full lg:w-auto">
              コース一覧を見る
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
