import Link from "next/link";
import { Logo } from "@/components/ui/Icon";

const links = [
  { label: "利用規約", href: "#" },
  { label: "プライバシーポリシー", href: "#" },
  { label: "よくある質問", href: "#" },
  { label: "お問い合わせ", href: "#" },
];

/** PC フッター（Mobile では表示しない） */
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-10 py-9">
      <div className="mx-auto flex max-w-[1240px] items-center gap-8">
        <Logo height={28} style={{ opacity: 0.9 }} />
        <div className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-13 text-ink3 hover:text-brand-deep"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <span className="ml-auto text-12 text-ink4">
          © 2026 フリキャリ / FREELY CAREER
        </span>
      </div>
    </footer>
  );
}
