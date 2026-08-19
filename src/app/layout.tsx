import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Noto_Sans_JP } from "next/font/google";
import { AuthHashHandler } from "@/components/auth/AuthHashHandler";
import "./globals.css";

/** 本文書体 */
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  preload: false,
  fallback: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "sans-serif"],
});

/** 見出し・ボタン・数値強調に使う丸ゴシック */
const mplusRounded = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-mplus-rounded",
  preload: false,
  fallback: ["Hiragino Maru Gothic ProN", "Hiragino Sans", "Meiryo", "sans-serif"],
});

export const metadata: Metadata = {
  title: "フリキャリ | 動画編集 × AI を動画で学べる学習サイト",
  description:
    "動画編集 × AI を動画中心で学べるオンライン学習サイト「フリキャリ」の学習画面です。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F8FF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${mplusRounded.variable}`}>
      <body>
        {/*
          招待メール等がハッシュでトークンを返す暗黙フローを受け止める。
          ハッシュが無いページでは何も描画しない。
        */}
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
