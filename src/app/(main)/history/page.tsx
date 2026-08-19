"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CategoryChips } from "@/components/ui/Filters";
import { HistoryRowMobile, HistoryRowPc } from "@/components/history/HistoryRow";
import { StatCardMobile, StatCardPc, useHistoryStats } from "@/components/history/StatCards";
import { TimelineGroup } from "@/components/history/TimelineGroup";
import { useContent } from "@/lib/content/context";

type StatusFilter = "all" | "in_progress" | "completed";

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "in_progress", label: "視聴中" },
  { key: "completed", label: "視聴済み" },
];

const description = (
  <>
    これまでに視聴した動画を、新しい順に確認できます。
    <br />
    途中の動画はそのまま続きから再生できます。
  </>
);

export default function HistoryPage() {
  const content = useContent();
  const historyStats = useHistoryStats();
  const [status, setStatus] = useState<StatusFilter>("all");

  const groups = useMemo(() => {
    return content
      .getHistoryGroups()
      .map((group) => ({
        label: group.label,
        events:
          status === "all"
            ? group.events
            : group.events.filter(
                (e) => content.getLessonStatus(e.lessonId) === status,
              ),
      }))
      .filter((group) => group.events.length > 0);
  }, [content, status]);

  const isEmpty = groups.length === 0;

  const emptyNote = (
    <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      <p className="text-135 leading-[1.8] text-ink3">
        条件に合う学習履歴はありません。
      </p>
    </div>
  );

  const moreButton = (
    <button
      type="button"
      className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-brand-tint2 bg-surface px-7 text-14 font-bold text-brand-deep transition-colors hover:bg-brand-tint"
    >
      もっと見る
    </button>
  );

  return (
    <>
      {/* ============================ Mobile ============================ */}
      {/* Claude Design に Mobile 版が無いため、PC の情報構造を
          既存 Mobile Design System（TOP / コース一覧 / 動画一覧 - Mobile）で
          1 カラム化する。タイムラインのドットと縦レールはそのまま維持する。 */}
      <div className="lg:hidden">
        <main className="flex flex-col gap-8 pt-5">
          <section className="px-4">
            <p className="text-125 leading-[1.7] text-ink3">{description}</p>
          </section>

          {/* サマリーは「フリキャリ TOP - Mobile」の今週の学習と同じ横スクロール */}
          <section>
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1">
              {historyStats.map((item) => (
                <StatCardMobile key={item.key} item={item} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-4">
              <Icon name="icon-film" size={20} />
              <h2 className="font-rounded text-16 font-bold text-ink">
                最近見た動画
              </h2>
            </div>

            {/* PC はセクション見出しの右端に並ぶが、Mobile は幅が足りないため
                Mobile Design System のチップ帯として独立した行に置く */}
            <CategoryChips
              items={statusFilters}
              value={status}
              onChange={setStatus}
              height={34}
              fontSize={12.5}
              scrollOnMobile
              className="px-4"
            />

            <div className="flex flex-col gap-5 px-4">
              {isEmpty
                ? emptyNote
                : groups.map((group) => (
                    <TimelineGroup
                      key={group.label}
                      label={group.label}
                      count={group.events.length}
                      variant="mobile"
                    >
                      {group.events.map((event) => (
                        <HistoryRowMobile
                          key={event.id}
                          lessonId={event.lessonId}
                          viewedAtLabel={event.viewedAtLabel}
                        />
                      ))}
                    </TimelineGroup>
                  ))}
            </div>

            {!isEmpty && (
              <div className="flex justify-center px-4 pt-1">{moreButton}</div>
            )}
          </section>
        </main>
      </div>

      {/* ============================== PC ============================== */}
      <div className="hidden lg:block">
        <main className="mx-auto flex max-w-page flex-col gap-14 px-10 pb-20 pt-11">
          <section
            className="grid items-center gap-8"
            style={{ gridTemplateColumns: "1fr 200px" }}
          >
            <div className="flex flex-col gap-2.5">
              <h1 className="font-rounded text-28 font-bold text-ink">学習履歴</h1>
              <p className="text-15 leading-[1.8] text-ink-sub2">{description}</p>
            </div>
            <div className="flex justify-end">
              <img
                src="/illust/illust-girl-soft.png"
                alt=""
                className="block h-auto"
                style={{ width: 200 }}
              />
            </div>
          </section>

          <section className="grid grid-cols-4 gap-5">
            {historyStats.map((item) => (
              <StatCardPc key={item.key} item={item} />
            ))}
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <Icon name="icon-film" size={24} />
              <h2 className="font-rounded text-20 font-bold text-ink">
                最近見た動画
              </h2>
              <CategoryChips
                items={statusFilters}
                value={status}
                onChange={setStatus}
                height={34}
                fontSize={12.5}
                className="ml-auto"
              />
            </div>

            {isEmpty
              ? emptyNote
              : groups.map((group) => (
                  <TimelineGroup
                    key={group.label}
                    label={group.label}
                    count={group.events.length}
                    variant="pc"
                  >
                    {group.events.map((event) => (
                      <HistoryRowPc
                        key={event.id}
                        lessonId={event.lessonId}
                        viewedAtLabel={event.viewedAtLabel}
                      />
                    ))}
                  </TimelineGroup>
                ))}

            {!isEmpty && (
              <div className="flex justify-center pt-2">{moreButton}</div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
