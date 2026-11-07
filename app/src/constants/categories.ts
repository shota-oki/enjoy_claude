// カテゴリ定義（DB設計書 共通 5.1）。カテゴリは固定でDBには保存しない。
// icon は SC-07 のカテゴリ行に表示する（SC-07 確認事項 No.1：意匠は実装時に決定）
export const CATEGORIES = [
  { id: "tops", name: "トップス", icon: "👕" },
  { id: "bottoms", name: "ボトムス", icon: "👖" },
  { id: "outer", name: "アウター", icon: "🧥" },
  { id: "setup", name: "セットアップ・スーツ", icon: "🤵" },
  { id: "shoes", name: "シューズ", icon: "👟" },
  { id: "bag", name: "バッグ", icon: "🎒" },
  { id: "hat", name: "帽子", icon: "🧢" },
  { id: "accessory", name: "アクセサリー・小物", icon: "⌚" },
  { id: "other", name: "その他", icon: "📦" },
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
