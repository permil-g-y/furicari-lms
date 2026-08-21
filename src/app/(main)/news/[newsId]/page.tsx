import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementBody } from "@/components/news/AnnouncementBody";
import { MarkAsRead } from "@/components/news/MarkAsRead";
import { Icon } from "@/components/ui/Icon";
import {
  announcementCategoryLabel,
  announcementCategoryStyle,
} from "@/lib/news/presentation";
import { getAnnouncement, getNextAnnouncement } from "@/lib/news/server";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  const { newsId } = await params;
  const announcement = await getAnnouncement(newsId);
  if (!announcement) notFound();

  const tone = announcementCategoryStyle[announcement.category];
  const next = await getNextAnnouncement(announcement.id);

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pt-4 pb-2 lg:gap-6 lg:px-10 lg:pt-8 lg:pb-20">
      {/* 実際に画面へ出たときにだけ既読にする（プリフェッチでは既読にしない） */}
      <MarkAsRead slug={announcement.id} />
      {/* パンくず（Mobile は MobileHeader の戻るが担当するため非表示） */}
      <nav className="hidden items-center gap-2 text-13 text-ink4 lg:flex">
        <Link href="/news" className="text-ink3 hover:text-brand-deep">
          お知らせ
        </Link>
        <span>〉</span>
        <span className="text-ink2">{announcement.title}</span>
      </nav>

      <article className="mx-auto flex w-full max-w-article flex-col gap-5 rounded-18 border border-line bg-surface p-5 shadow-card lg:gap-7 lg:rounded-panel lg:p-[48px_56px_52px]">
        <header className="flex flex-col gap-3 lg:gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="flex items-center rounded-full px-3 text-12 font-bold"
              style={{
                height: 26,
                background: tone.bg,
                color: tone.color,
                border: tone.border ? `1px solid ${tone.border}` : undefined,
              }}
            >
              {announcementCategoryLabel[announcement.category]}
            </span>
            {announcement.isNew && (
              <span className="flex h-[22px] items-center rounded-6 bg-alert px-2 text-105 font-bold tracking-[.06em] text-white">
                NEW
              </span>
            )}
            <span className="text-13 text-ink4">{announcement.date}</span>
          </div>
          <h1 className="text-pretty font-rounded text-21 leading-[1.55] font-bold text-ink lg:text-28">
            {announcement.title}
          </h1>
        </header>

        <div className="h-px bg-surface-alt" />

        <AnnouncementBody body={announcement.body} />

        {announcement.relatedLinks && announcement.relatedLinks.length > 0 && (
          <>
            <div className="h-px bg-surface-alt" />
            <section className="flex flex-col gap-[14px]">
              <h2 className="font-rounded text-15 font-bold text-ink lg:text-16">
                関連リンク
              </h2>
              <div className="flex flex-col gap-2.5">
                {announcement.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-16 border border-line bg-surface-subtle2 p-4 transition-colors hover:border-brand-tint2 hover:bg-page lg:px-[18px]"
                  >
                    <Icon name={link.icon} size={20} />
                    <span className="min-w-0 flex-1 text-14 font-medium text-ink lg:text-145">
                      {link.label}
                    </span>
                    <span className="text-13 font-bold text-brand-deep">〉</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </article>

      {/* 記事下フッターナビ（Mobile は縦積み） */}
      <div className="mx-auto flex w-full max-w-article flex-col items-stretch gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:pt-2">
        <Link
          href="/news"
          className="flex h-[52px] shrink-0 items-center justify-center gap-2.5 rounded-full border border-brand-tint2 bg-surface px-[26px] text-14 font-bold text-brand-deep transition-colors hover:bg-brand-tint lg:text-145"
        >
          ← お知らせ一覧へ戻る
        </Link>
        {next && (
          <Link
            href={`/news/${next.id}`}
            className="min-w-0 truncate text-center text-13 text-ink3 hover:text-brand-deep lg:text-135"
          >
            次のお知らせ：{next.title} 〉
          </Link>
        )}
      </div>
    </main>
  );
}
