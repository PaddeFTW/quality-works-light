export const YEAR_PRESETS = [
  { title: "Intern revision", kind: "revision", weeks: 6 },
  { title: "Skyddsrond", kind: "skyddsrond", weeks: 4 },
  { title: "Ledningens genomgång", kind: "ledning", weeks: 12 },
] as const;

export function laterThisYear(weeks: number) {
  const now = new Date();
  const date = new Date(now);
  date.setDate(now.getDate() + weeks * 7);
  if (date.getFullYear() !== now.getFullYear()) return `${now.getFullYear()}-12-15`;
  return date.toISOString().slice(0, 10);
}
