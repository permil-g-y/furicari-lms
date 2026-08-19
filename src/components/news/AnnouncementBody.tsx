import { Fragment } from "react";
import type { AnnouncementBlock } from "@/lib/types";

/**
 * お知らせ本文（AnnouncementBlock[]）のレンダラー。
 *
 * Claude Design の記事は「見出しごとのセクション（gap 14px）」で構成され、
 * 見出しより前のリード段落だけ 15.5px / #3D4C66、セクション内の段落は
 * 15px / #5B6B85 と書き分けられている。その構造をそのまま復元する。
 * 連続する paragraph は Claude Design 上 <br> で 1 つの <p> にまとめられているため
 * ここでも 1 つの <p> に束ねる。
 */
type BodyBlock = Exclude<AnnouncementBlock, { type: "heading" }>;
type Group = { heading?: string; blocks: BodyBlock[] };
type Chunk =
  | { type: "paragraphs"; texts: string[] }
  | Extract<AnnouncementBlock, { type: "callout" }>;

function toGroups(body: AnnouncementBlock[]): Group[] {
  const groups: Group[] = [];
  for (const block of body) {
    if (block.type === "heading") {
      groups.push({ heading: block.text, blocks: [] });
      continue;
    }
    if (groups.length === 0) groups.push({ blocks: [] });
    groups[groups.length - 1].blocks.push(block);
  }
  return groups;
}

function toChunks(blocks: BodyBlock[]): Chunk[] {
  const chunks: Chunk[] = [];
  for (const block of blocks) {
    if (block.type === "callout") {
      chunks.push(block);
      continue;
    }
    const last = chunks[chunks.length - 1];
    if (last && last.type === "paragraphs") last.texts.push(block.text);
    else chunks.push({ type: "paragraphs", texts: [block.text] });
  }
  return chunks;
}

function Paragraph({ texts, lead }: { texts: string[]; lead: boolean }) {
  return (
    <p
      className={`text-pretty leading-[1.85] lg:leading-[2] ${
        lead
          ? "text-145 text-ink-sub lg:text-155"
          : "text-14 text-ink2 lg:text-15"
      }`}
    >
      {texts.map((text, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {text}
        </Fragment>
      ))}
    </p>
  );
}

function Callout({ block }: { block: Extract<AnnouncementBlock, { type: "callout" }> }) {
  return (
    <div className="flex flex-col gap-3 rounded-16 border border-line bg-surface-subtle p-4 lg:px-6 lg:py-[22px]">
      <span className="text-13 font-bold text-brand-deep">{block.title}</span>
      <div className="flex flex-col gap-[9px]">
        {block.items.map((item) => (
          <span key={item} className="text-135 leading-[1.7] text-ink-sub lg:text-14">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AnnouncementBody({ body }: { body?: AnnouncementBlock[] }) {
  if (!body || body.length === 0) {
    return (
      <p className="text-145 leading-[1.85] text-ink3 lg:text-155 lg:leading-[2]">
        このお知らせの本文は準備中です。
      </p>
    );
  }

  const groups = toGroups(body);

  return (
    <div className="flex flex-col gap-[22px] lg:gap-[26px]">
      {groups.map((group, gi) => (
        <section key={gi} className="flex flex-col gap-[14px]">
          {group.heading && (
            <h2 className="font-rounded text-16 font-bold text-ink lg:text-18">
              {group.heading}
            </h2>
          )}
          {toChunks(group.blocks).map((chunk, ci) =>
            chunk.type === "callout" ? (
              <Callout key={ci} block={chunk} />
            ) : (
              <Paragraph key={ci} texts={chunk.texts} lead={!group.heading} />
            ),
          )}
        </section>
      ))}
    </div>
  );
}
