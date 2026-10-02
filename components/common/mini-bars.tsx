interface MiniBarItem {
  label: string;
  value: number;
  current?: boolean;
}

export function MiniBars({ items, empty }: { items: MiniBarItem[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const hasAny = items.some((item) => item.value > 0);
  if (!hasAny) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Stapeldiagram">
      {items.map((item) => (
        <div className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1" key={item.label}>
          <span className="text-center text-[10px] text-muted-foreground">{item.value || ""}</span>
          <div
            className={item.current ? "w-full rounded-t-md bg-primary" : "w-full rounded-t-md bg-primary/35"}
            style={{ height: `${Math.max(item.value ? 8 : 2, (item.value / max) * 100)}%` }}
          />
          <span className="truncate text-center text-[10px] font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
