/* eslint-disable @next/next/no-img-element */

import { Icon } from "@/components/ui/Icon";
import { getContent } from "@/lib/content/server";

/**
 * 挨拶ヒーロー。
 * PC は 1fr 300px の 2 カラム、Mobile は日付 + 見出しの左カラムに 104px のイラストを添える。
 */
export async function HeroSection({ userName }: { userName: string }) {
  const content = await getContent();
  const { todayLabel } = content;
  const course = content.getPrimaryCourse();
  const nextLesson = content.getLesson(content.getResumeLessonId(course));

  return (
    <>
      {/* ---- Mobile ---- */}
      <section className="flex items-center gap-3 px-4 lg:hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="text-115 font-medium text-ink3">{todayLabel}</span>
          <h1 className="font-rounded text-21 font-bold leading-[1.45] text-ink">
            おかえりなさい、
            <br />
            {userName}さん！
          </h1>
        </div>
        <img
          src="/illust/illust-girl.png"
          alt=""
          className="block shrink-0"
          style={{ width: 104, height: "auto" }}
        />
      </section>

      {/* ---- PC ---- */}
      <section className="hidden items-center gap-8 lg:grid lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="icon-sparkle-duo" size={22} />
            <span className="text-13 font-medium tracking-[.04em] text-ink3">{todayLabel}</span>
          </div>
          <h1 className="font-rounded text-28 font-bold leading-[1.45] text-ink">
            おかえりなさい、{userName}さん！
          </h1>
          <p className="text-155 leading-[1.8] text-ink-sub2">
            今日も少しずつスキルアップしましょう。
            <br />
            前回は「{nextLesson?.title}」の途中まで進んでいます。
          </p>
        </div>
        <div className="flex justify-end">
          <img
            src="/illust/illust-girl.png"
            alt=""
            className="block"
            style={{ width: 300, height: "auto" }}
          />
        </div>
      </section>
    </>
  );
}
