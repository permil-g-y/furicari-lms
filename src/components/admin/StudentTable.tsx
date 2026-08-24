import Link from "next/link";
import { StudentStatusTag } from "./StudentStatusTag";
import { adminDate, progressLabel, studentStatus } from "@/lib/admin/format";
import type { StudentRow } from "@/lib/admin/students";

/**
 * 受講生一覧。
 *
 * 横に長いので、狭い画面では表ではなくカードとして積む。
 * 表のまま横スクロールさせると、運営が一番見たい「状態」が画面外へ出てしまう。
 */
export function StudentTable({ rows }: { rows: readonly StudentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-6 py-8 text-center text-14 text-ink3">
        該当する受講生がいません。
      </p>
    );
  }

  return (
    <>
      {/* 狭い画面: カード */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => {
          const status = studentStatus(row);
          return (
            <li key={row.id}>
              <Link
                href={`/admin/students/${row.id}`}
                className="block rounded-2xl border border-line bg-surface px-5 py-4 transition-colors hover:border-brand-tint2"
              >
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate font-rounded text-15 font-bold text-ink">
                    {row.displayName}
                  </span>
                  <StudentStatusTag label={status.label} tone={status.tone} />
                </div>
                <p className="mt-1 truncate text-125 text-ink3">{row.email}</p>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-125 text-ink2">
                  <div className="flex gap-1.5">
                    <dt className="text-ink4">受講</dt>
                    <dd>{row.enrollments.filter((e) => e.active).length} コース</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink4">進捗</dt>
                    <dd>{progressLabel(row.completedLessons, row.totalLessons)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink4">最終学習</dt>
                    <dd>{adminDate(row.lastViewedAt)}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* PC: 表 */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface lg:block">
        <table className="w-full text-14">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-left text-125 text-ink3">
              <th className="px-5 py-3 font-medium">受講生</th>
              <th className="px-5 py-3 font-medium">状態</th>
              <th className="px-5 py-3 font-medium">受講コース</th>
              <th className="px-5 py-3 font-medium">進捗</th>
              <th className="px-5 py-3 font-medium">最終学習</th>
              <th className="px-5 py-3 font-medium">最終ログイン</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = studentStatus(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-line last:border-b-0 transition-colors hover:bg-brand-tint/40"
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/students/${row.id}`} className="block">
                      <span className="block font-medium text-ink">{row.displayName}</span>
                      <span className="block text-125 text-ink3">{row.email}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <StudentStatusTag label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-5 py-3.5 text-ink2 tabular-nums">
                    {row.enrollments.filter((e) => e.active).length} コース
                  </td>
                  <td className="px-5 py-3.5 text-ink2 tabular-nums">
                    {progressLabel(row.completedLessons, row.totalLessons)}
                  </td>
                  <td className="px-5 py-3.5 text-ink2 tabular-nums">
                    {adminDate(row.lastViewedAt)}
                  </td>
                  <td className="px-5 py-3.5 text-ink2 tabular-nums">
                    {adminDate(row.lastSignInAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
