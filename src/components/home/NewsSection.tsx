/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { announcements } from "@/lib/mock";
import type { Announcement } from "@/lib/types";

/** NEW バッジ / カテゴリバッジ（高さ 22・角丸 6・10.5px の太字） */
function NewsBadge({ item, height = 22 }: { item: Announcement; height?: number }) {
  if (item.isNew) {
    return (
      <span
        className="flex shrink-0 items-center rounded-6 bg-alert text-105 font-bold tracking-[.06em] text-white"
        style={{ height, paddingInline: 8 }}
      >
        NEW
      </span>
    );
  }
  // Claude Design の TOP は、NEW 以外を一律「お知らせ」の汎用バッジで出す。
  // カテゴリ別の色分けはお知らせ一覧ページ側の表現。
  return (
    <span
      className="flex shrink-0 items-center rounded-6 bg-brand-tint text-105 font-bold text-brand-deep"
      style={{ height, paddingInline: 8 }}
    >
      お知らせ
    </span>
  );
}

/**
 * お知らせ + プロモカード。
 * PC は 1fr 380px の 2 カラム（お知らせ 3 件 + コース一覧への誘導）。
 * Mobile は最新 1 件だけの横長バナー。
 */
export function NewsSection() {
  const latest = announcements.slice(0, 3);
  const top = announcements[0];

  return (
    <>
      {/* ---- Mobile ---- */}
      <section className="px-4 lg:hidden">
        <Link
          href={`/news/${top.id}`}
          className="flex items-center gap-3 rounded-18 border border-line bg-surface p-4 shadow-card"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-12 bg-brand-tint">
            <Icon name="icon-chat" size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-[7px]">
              <NewsBadge item={top} height={20} />
              <span className="text-115 text-ink4">{top.date}</span>
            </div>
            <span className="text-135 font-medium leading-[1.5] text-ink">{top.title}</span>
          </div>
        </Link>
      </section>

      {/* ---- PC ---- */}
      <section className="hidden items-start gap-6 lg:grid lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-1.5 rounded-card border border-line bg-surface px-7 pb-[22px] pt-7 shadow-card">
          <div className="flex items-center gap-2.5 pb-3">
            <Icon name="icon-chat" size={22} />
            <h2 className="font-rounded text-18 font-bold text-ink">お知らせ</h2>
            <Link href="/news" className="ml-auto text-13 font-medium text-brand-deep">
              すべて見る 〉
            </Link>
          </div>

          {latest.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="flex items-center gap-3.5 rounded-12 border-t border-surface-alt px-3 py-4 transition-colors hover:bg-surface-subtle"
            >
              <span className="w-[88px] shrink-0 text-125 text-ink4">{item.date}</span>
              <NewsBadge item={item} />
              <span className="text-145 font-medium text-ink">{item.title}</span>
            </Link>
          ))}
        </div>

        <div
          className="flex flex-col items-start gap-3.5 rounded-card border border-brand-tint4 p-7"
          style={{ background: "linear-gradient(180deg,#EAF4FF,#F7FBFF)" }}
        >
          <h2 className="font-rounded text-18 font-bold leading-[1.6] text-ink">
            次に学ぶコースを
            <br />
            探してみませんか？
          </h2>
          <p className="text-13 leading-[1.8] text-ink-sub2">
            目標やレベルに合わせて、あなたにぴったりのコースを選べます。
          </p>
          <img
            src="/illust/illust-studio.png"
            alt=""
            className="my-0.5 block w-full"
            style={{ height: "auto" }}
          />
          <Button href="/courses" size={48}>
            コース一覧を見る
          </Button>
        </div>
      </section>
    </>
  );
}
