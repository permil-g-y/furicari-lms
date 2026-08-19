import type {
  CategoryKey,
  Chapter,
  Course,
  Lesson,
  Level,
  ToolKey,
} from "@/lib/types";
import { ms } from "./taxonomy";

/* =========================================================================
   コース / チャプター / レッスン
   Claude Design 内に散在していたダミーデータをここへ集約している。
   （コース詳細と動画閲覧で重複定義されていたカリキュラム 18 本もここが唯一の定義）
   ========================================================================= */

type LessonOpts = {
  tool?: ToolKey;
  category?: CategoryKey;
  level?: Level;
  description?: string;
  keyPoints?: string[];
  publishedAt?: string;
};

/** コース単位のデフォルト値を束ねて Lesson を生成する */
function lessonFactory(
  courseId: string,
  defaults: { tool: ToolKey; category: CategoryKey; level: Level; publishedAt: string },
) {
  return (
    chapterNo: number,
    number: number,
    title: string,
    durationSeconds: number,
    opts: LessonOpts = {},
  ): Lesson => ({
    id: `${courseId}-${String(number).padStart(2, "0")}`,
    courseId,
    chapterId: `${courseId}-ch${chapterNo}`,
    number,
    title,
    description: opts.description,
    keyPoints: opts.keyPoints,
    durationSeconds,
    tool: opts.tool ?? defaults.tool,
    category: opts.category ?? defaults.category,
    level: opts.level ?? defaults.level,
    publishedAt: opts.publishedAt ?? defaults.publishedAt,
    sortOrder: number,
  });
}

function chapters(courseId: string, titles: string[]): Chapter[] {
  return titles.map((title, i) => ({
    id: `${courseId}-ch${i + 1}`,
    courseId,
    number: i + 1,
    title,
    sortOrder: i + 1,
  }));
}

/* ------------------------------------------------------------------ *
 * 1. Premiere Pro 実践コース（全18本・学習中 44%）
 * ------------------------------------------------------------------ */
const PR = "premiere-practice";
const pr = lessonFactory(PR, {
  tool: "premiere",
  category: "video-editing",
  level: "beginner",
  publishedAt: "2026-06-01",
});

const premiereChapters = chapters(PR, [
  "はじめに",
  "基本操作をマスターする",
  "カット編集",
  "テロップ・字幕",
  "BGM・SE",
  "書き出し",
]);

const premiereLessons: Lesson[] = [
  pr(1, 1, "このコースの進め方", ms(4, 20)),
  pr(1, 2, "必要な機材とソフトの準備", ms(6, 5)),
  pr(2, 3, "プロジェクトの作成と素材の読み込み", ms(8, 30), {
    description: "作業前の準備とフォルダ整理のルールを決めておきましょう。",
  }),
  pr(2, 4, "タイムラインの基本操作", ms(9, 15), {
    description: "トラックの構造とクリップの並べ方を、実際の画面で確認します。",
  }),
  pr(2, 5, "カット編集の基本を身につける", ms(12, 45), {
    description: "テンポよく見せるための、カットの入れどころと間の作り方を解説します。",
    keyPoints: [
      "リップル削除とトリミングの使い分け",
      "「間」を残すべき場面の見極め方",
      "編集速度が上がるショートカット5つ",
    ],
  }),
  pr(2, 6, "ショートカットで編集を速くする", ms(7, 40)),
  pr(3, 7, "リズムを意識したカットの作り方", ms(11, 20)),
  pr(3, 8, "ジャンプカットとつなぎの工夫", ms(9, 50)),
  pr(3, 9, "トランジションの使いどころ", ms(8, 10)),
  pr(4, 10, "テロップデザインの作り方", ms(11, 5), {
    description: "読みやすい文字サイズ・配置・余白の基準を身につけます。",
    publishedAt: "2026-08-14",
  }),
  pr(4, 11, "自動文字起こしで字幕を作る", ms(10, 25)),
  pr(4, 12, "テロップのテンプレート化", ms(7, 55)),
  pr(5, 13, "BGMの選び方と音量バランス", ms(9, 30)),
  pr(5, 14, "効果音で印象を変える", ms(8, 45)),
  pr(5, 15, "ナレーションの音声補正", ms(10, 10)),
  pr(6, 16, "YouTube向けの書き出し設定", ms(7, 30)),
  pr(6, 17, "SNS・ショート動画向けの書き出し", ms(6, 50)),
  pr(6, 18, "納品前のチェックリスト", ms(5, 40)),
];

/* ------------------------------------------------------------------ *
 * 2. AI動画編集 効率化コース（全14本・学習中 21%）
 * ------------------------------------------------------------------ */
const AI = "ai-editing";
const ai = lessonFactory(AI, {
  tool: "chatgpt",
  category: "ai",
  level: "intermediate",
  publishedAt: "2026-07-01",
});

const aiChapters = chapters(AI, [
  "AI編集のはじめ方",
  "AIで素材を整える",
  "表現の幅を広げる",
  "AIで編集を自動化する",
]);

const aiLessons: Lesson[] = [
  ai(1, 1, "AI編集でできることを知る", ms(6, 20), { level: "beginner" }),
  ai(1, 2, "AIツールの準備と初期設定", ms(7, 10), { level: "beginner" }),
  ai(1, 3, "プロンプトの基本を覚える", ms(5, 50), { level: "beginner" }),
  ai(1, 4, "AIで動画の構成台本を作る", ms(9, 40), {
    level: "beginner",
    description: "企画からナレーション原稿まで、AIと一緒に組み立てる手順です。",
    publishedAt: "2026-08-16",
  }),
  ai(1, 5, "AIで効率UP！自動字幕・要約の使い方", ms(8, 15), {
    description: "文字起こしと要約を自動化して、編集時間を大きく短縮します。",
  }),
  ai(1, 6, "AIに指示するときのコツ", ms(7, 25)),
  ai(2, 7, "素材の整理とネーミングを自動化する", ms(8, 40)),
  ai(2, 8, "AIで不要カットを見つける", ms(9, 0)),
  ai(3, 9, "After Effectsでアニメーション作成", ms(14, 20), {
    tool: "aftereffects",
    category: "video-editing",
    description: "ロゴやテキストに動きをつけて、動画の質感を一段引き上げます。",
    publishedAt: "2026-08-18",
  }),
  ai(3, 10, "AIでBGM・SEを選ぶ", ms(8, 5)),
  ai(4, 11, "AIによる素材の自動タグ付け", ms(9, 10)),
  ai(4, 12, "文字起こしから字幕データを一括生成する", ms(10, 30)),
  ai(4, 13, "カット候補の抽出とチェックのコツ", ms(11, 15)),
  ai(4, 14, "自動化しない方がよい作業の見極め方", ms(7, 45)),
];

/* ------------------------------------------------------------------ *
 * 3. 動画編集 基礎コース（全12本・完了 100%）
 * ------------------------------------------------------------------ */
const BASIC = "editing-basic";
const bs = lessonFactory(BASIC, {
  tool: "premiere",
  category: "video-editing",
  level: "beginner",
  publishedAt: "2026-04-01",
});

const basicChapters = chapters(BASIC, [
  "動画編集をはじめよう",
  "編集の基本操作",
  "音と見た目を整える",
  "仕上げと公開",
]);

const basicLessons: Lesson[] = [
  bs(1, 1, "動画編集の全体像をつかむ", ms(5, 10)),
  bs(1, 2, "編集ソフトの選び方", ms(6, 30)),
  bs(1, 3, "素材の集め方と管理のルール", ms(7, 20)),
  bs(2, 4, "カットの基本を覚える", ms(8, 40)),
  bs(2, 5, "つなぎ方のパターンを知る", ms(7, 50)),
  bs(2, 6, "テロップを入れてみる", ms(9, 10)),
  bs(3, 7, "BGMの入れ方と音量の目安", ms(6, 45)),
  bs(3, 8, "効果音の使いどころ", ms(5, 55)),
  bs(3, 9, "色味を整える基本", ms(8, 5)),
  bs(4, 10, "書き出しの基本設定", ms(6, 20)),
  bs(4, 11, "サムネイルの作り方", ms(7, 35)),
  bs(4, 12, "公開までの流れを確認する", ms(5, 45)),
];

/* ------------------------------------------------------------------ *
 * 4. CapCut 実践コース（全10本・未開始）
 * ------------------------------------------------------------------ */
const CC = "capcut-practice";
const cc = lessonFactory(CC, {
  tool: "capcut",
  category: "video-editing",
  level: "beginner",
  publishedAt: "2026-05-10",
});

const capcutChapters = chapters(CC, [
  "CapCutをはじめよう",
  "ショート動画の作り方",
  "仕上げと投稿",
]);

const capcutLessons: Lesson[] = [
  cc(1, 1, "CapCutの画面構成を知る", ms(5, 30)),
  cc(1, 2, "CapCutで作る！SNS向けショート動画編集", ms(10, 30), {
    description: "縦型動画のテンポと文字入れを、スマホでも作れる形で解説します。",
  }),
  cc(1, 3, "テンプレートを活用する", ms(6, 15)),
  cc(2, 4, "縦型構図の考え方", ms(7, 0)),
  cc(2, 5, "テロップを速く入れるコツ", ms(8, 20)),
  cc(2, 6, "音ハメ編集の基本", ms(9, 5)),
  cc(2, 7, "トレンド音源の選び方", ms(6, 40)),
  cc(3, 8, "エフェクトの使いどころ", ms(7, 25)),
  cc(3, 9, "書き出し設定を整える", ms(5, 50)),
  cc(3, 10, "各SNSへの投稿のコツ", ms(6, 10)),
];

/* ------------------------------------------------------------------ *
 * 5. AI × 案件獲得コース（全20本・未開始）
 * ------------------------------------------------------------------ */
const ACQ = "ai-client-acquisition";
const ac = lessonFactory(ACQ, {
  tool: "claude",
  category: "client-acquisition",
  level: "advanced",
  publishedAt: "2026-05-20",
});

const acqChapters = chapters(ACQ, [
  "案件獲得の全体像",
  "ポートフォリオを作る",
  "提案と見積もり",
  "継続案件につなげる",
]);

const acqLessons: Lesson[] = [
  ac(1, 1, "案件獲得までの流れを知る", ms(6, 50)),
  ac(1, 2, "自分の強みを言語化する", ms(8, 10)),
  ac(1, 3, "単価の考え方を身につける", ms(7, 30)),
  ac(1, 4, "動き出す前に整えておく準備", ms(6, 5)),
  ac(2, 5, "ポートフォリオの構成を考える", ms(9, 20)),
  ac(2, 6, "掲載する作品の選び方", ms(7, 45)),
  ac(2, 7, "AIで作品紹介文を書く", ms(8, 35)),
  ac(2, 8, "見せ方を整えて印象を上げる", ms(7, 10)),
  ac(2, 9, "公開と更新のコツ", ms(6, 25)),
  ac(3, 10, "はじめての提案文の書き方", ms(13, 30), {
    level: "intermediate",
    description: "実績が少なくても伝わる、提案文の構成と例文を紹介します。",
    publishedAt: "2026-08-12",
  }),
  ac(3, 11, "見積もりの作り方", ms(9, 40)),
  ac(3, 12, "相場の調べ方と考え方", ms(7, 55)),
  ac(3, 13, "AIで提案文を磨く", ms(8, 50)),
  ac(3, 14, "断られたあとの動き方", ms(6, 35)),
  ac(4, 15, "初回納品で信頼を得る", ms(8, 15)),
  ac(4, 16, "レスポンスの基本を整える", ms(6, 50)),
  ac(4, 17, "単価を上げる交渉の進め方", ms(9, 30)),
  ac(4, 18, "紹介につなげる動き方", ms(7, 20)),
  ac(4, 19, "トラブルを未然に防ぐ", ms(8, 0)),
  ac(4, 20, "案件管理を仕組み化する", ms(7, 45)),
];

/* ------------------------------------------------------------------ *
 * 6. AI × クライアントワークコース（全16本・未開始）
 * ------------------------------------------------------------------ */
const CW = "ai-client-work";
const cw = lessonFactory(CW, {
  tool: "claude",
  category: "client-work",
  level: "advanced",
  publishedAt: "2026-07-28",
});

const clientWorkChapters = chapters(CW, [
  "クライアントワークの基本",
  "ヒアリングと企画",
  "見積りと進行管理",
  "修正対応と継続",
]);

const clientWorkLessons: Lesson[] = [
  cw(1, 1, "クライアントワークの流れをつかむ", ms(7, 10)),
  cw(1, 2, "最初のやりとりで決まること", ms(6, 40)),
  cw(1, 3, "契約前に確認しておくこと", ms(8, 20)),
  cw(1, 4, "スケジュールの立て方", ms(7, 0)),
  cw(2, 5, "ヒアリングシートの作り方", ms(9, 15)),
  cw(2, 6, "AIで企画案を広げる", ms(8, 30)),
  cw(2, 7, "構成案の伝え方", ms(7, 50)),
  cw(2, 8, "認識のズレを防ぐ進め方", ms(6, 55)),
  cw(3, 9, "見積りの組み立て方", ms(8, 45)),
  cw(3, 10, "追加費用の伝え方", ms(7, 25)),
  cw(3, 11, "進行状況の共有のしかた", ms(6, 30)),
  cw(3, 12, "納期を守る仕組みを作る", ms(7, 40)),
  cw(4, 13, "修正依頼の受け止め方", ms(8, 5)),
  cw(4, 14, "修正回数をルール化する", ms(6, 45)),
  cw(4, 15, "納品後のフォロー", ms(7, 15)),
  cw(4, 16, "継続契約につなげる提案", ms(8, 35)),
];

/* ------------------------------------------------------------------ *
 * 集約
 * ------------------------------------------------------------------ */

export const courses: Course[] = [
  {
    id: PR,
    title: "Premiere Pro 実践コース",
    description:
      "現場で使う編集フローを、カット編集からテロップ・書き出しまで一通り学びます。",
    category: "video-editing",
    level: "intermediate",
    cover: { bg: "#EAF4FF", icon: "icon-film" },
    totalLessons: 18,
    completedLessons: 8,
    durationLabel: "約6時間",
    status: "in_progress",
    nextLessonId: `${PR}-05`,
    learnPoints: [
      {
        title: "Premiere Proの基本操作とプロジェクト管理",
        note: "素材の整理からシーケンス設定まで、迷わない作業環境を作れます。",
      },
      {
        title: "テンポの良いカット編集の考え方",
        note: "見やすい間の取り方と、ショートカットを使った時短編集を身につけます。",
      },
      {
        title: "読みやすいテロップ・字幕のデザイン",
        note: "フォント選びと配置のルールを覚えて、動画の印象を整えます。",
      },
      {
        title: "納品まで見据えた書き出し設定",
        note: "YouTube・SNSそれぞれに適した出力設定を選べるようになります。",
      },
    ],
    sortOrder: 1,
  },
  {
    id: BASIC,
    title: "動画編集 基礎コース",
    description: "編集の考え方と基本操作を、はじめての人向けにやさしく解説します。",
    category: "video-editing",
    level: "beginner",
    cover: { bg: "#E9F7F1", icon: "icon-video" },
    totalLessons: 12,
    completedLessons: 12,
    durationLabel: "約4時間",
    status: "completed",
    nextLessonId: `${BASIC}-01`,
    sortOrder: 2,
  },
  {
    id: AI,
    title: "AI動画編集 効率化コース",
    description:
      "自動字幕・要約・素材生成などのAIツールで、編集時間を大きく短縮します。",
    category: "ai",
    level: "intermediate",
    cover: { bg: "#F0EEFF", text: "AI", textColor: "#7B7BE0" },
    totalLessons: 14,
    completedLessons: 3,
    durationLabel: "約5時間",
    status: "in_progress",
    nextLessonId: `${AI}-04`,
    sortOrder: 3,
  },
  {
    id: CC,
    title: "CapCut 実践コース",
    description:
      "スマホでも作れるSNS向けショート動画を、テンポよく仕上げる方法を学びます。",
    category: "video-editing",
    level: "beginner",
    cover: { bg: "#E7F7F4", icon: "icon-film" },
    totalLessons: 10,
    completedLessons: 0,
    durationLabel: "約3時間",
    status: "not_started",
    nextLessonId: `${CC}-01`,
    sortOrder: 4,
  },
  {
    id: ACQ,
    title: "AI × 案件獲得コース",
    description:
      "ポートフォリオ制作から提案文・営業まで、仕事につなげる進め方を学びます。",
    category: "client-acquisition",
    level: "advanced",
    cover: { bg: "#FFF0F3", icon: "icon-medal" },
    totalLessons: 20,
    completedLessons: 0,
    durationLabel: "約7時間",
    status: "not_started",
    nextLessonId: `${ACQ}-01`,
    sortOrder: 5,
  },
  {
    id: CW,
    title: "AI × クライアントワークコース",
    description:
      "ヒアリング・見積り・修正対応まで、継続案件につながる進め方をまとめました。",
    category: "client-work",
    level: "advanced",
    cover: { bg: "#FFF7E8", icon: "icon-chat" },
    totalLessons: 16,
    completedLessons: 0,
    durationLabel: "約5時間",
    status: "not_started",
    nextLessonId: `${CW}-01`,
    sortOrder: 6,
  },
];

export const allChapters: Chapter[] = [
  ...premiereChapters,
  ...aiChapters,
  ...basicChapters,
  ...capcutChapters,
  ...acqChapters,
  ...clientWorkChapters,
];

export const allLessons: Lesson[] = [
  ...premiereLessons,
  ...aiLessons,
  ...basicLessons,
  ...capcutLessons,
  ...acqLessons,
  ...clientWorkLessons,
];

/** コース詳細の説明（カードの短い説明とは別に、詳細ページ用の長文を持つコースがある） */
export const courseLongDescription: Record<string, string> = {
  [PR]:
    "現場で使う編集フローを、素材の読み込みからカット編集・テロップ・BGM・書き出しまで一通り学べるコースです。手を動かしながら進められる構成になっています。",
};
