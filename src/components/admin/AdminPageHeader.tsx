/** 管理画面の各ページ見出し。受講生画面と字面を揃えるためだけの薄い部品 */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="font-rounded text-22 font-bold text-ink">{title}</h1>
        {description && (
          <p className="mt-1.5 text-13 text-ink3">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
