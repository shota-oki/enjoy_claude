// カテゴリ定義（DB設計書 共通 5.1）。カテゴリは固定でDBには保存しない
export const CATEGORIES = [
  { id: "tops", name: "トップス" },
  { id: "bottoms", name: "ボトムス" },
  { id: "outer", name: "アウター" },
  { id: "setup", name: "セットアップ・スーツ" },
  { id: "shoes", name: "シューズ" },
  { id: "bag", name: "バッグ" },
  { id: "hat", name: "帽子" },
  { id: "accessory", name: "アクセサリー・小物" },
  { id: "other", name: "その他" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const CATEGORY_NAME_MAP = new Map<string, string>(
  CATEGORIES.map((c) => [c.id, c.name]),
);

export function getCategoryName(id: string): string {
  return CATEGORY_NAME_MAP.get(id) ?? "";
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORY_NAME_MAP.has(value);
}
