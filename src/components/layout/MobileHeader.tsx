import Link from "next/link";
import { Icon, Logo, SearchGlyph } from "@/components/ui/Icon";

/**
 * Mobile ヘッダー（高さ 56px・sticky）
 * title があるときはロゴを出さず、タイトルを 1 行省略で表示する。
 */
export function MobileHeader({
  title,
  back,
}: {
  title?: string;
  back?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/96 backdrop-blur-[8px]">
      <div className="flex h-14 items-center gap-2.5 px-4">
        {back && (
          <Link
            href={back}
            aria-label="戻る"
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-18 text-ink-sub"
          >
            ←
          </Link>
        )}

        {!title && (
          <Link href="/" className="block leading-none">
            <Logo height={26} />
          </Link>
        )}

        {title && (
          <span className="min-w-0 flex-1 truncate font-rounded text-16 font-bold text-ink">
            {title}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/videos"
            aria-label="検索"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-page"
          >
            <SearchGlyph size={12} color="#7C8CA6" thickness={1.75} />
          </Link>
          <Link
            href="/news"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-page"
          >
            <Icon name="icon-chat" size={20} alt="お知らせ" />
            <span className="absolute right-2 top-[7px] h-2 w-2 rounded-full border-2 border-white bg-alert" />
          </Link>
        </div>
      </div>
    </header>
  );
}
