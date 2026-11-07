// 季節定義（DB設計書 共通 5.3）。配列の順が表示・保存の順（春→夏→秋→冬）
export const SEASONS = [
  { id: "spring", name: "春" },
  { id: "summer", name: "夏" },
  { id: "autumn", name: "秋" },
  { id: "winter", name: "冬" },
] as const;

export type SeasonId = (typeof SEASONS)[number]["id"];

const SEASON_ORDER = new Map<string, number>(SEASONS.map((s, i) => [s.id, i]));

export function getSeasonName(id: string): string {
  return SEASONS.find((s) => s.id === id)?.name ?? "";
}

/** 季節を重複なく春→夏→秋→冬の順に並べる */
export function sortSeasons(ids: readonly SeasonId[]): SeasonId[] {
  return [...new Set(ids)].sort(
    (a, b) => (SEASON_ORDER.get(a) ?? 0) - (SEASON_ORDER.get(b) ?? 0),
  );
}
