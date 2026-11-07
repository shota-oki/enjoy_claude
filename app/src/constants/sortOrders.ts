// 並び順定義（DB設計書 共通 5.4）
export const SORT_ORDERS = [
  { id: "created_desc", name: "登録日が新しい順" },
  { id: "created_asc", name: "登録日が古い順" },
  { id: "purchase_desc", name: "購入日が新しい順" },
  { id: "purchase_asc", name: "購入日が古い順" },
  { id: "price_desc", name: "購入金額が高い順" },
  { id: "price_asc", name: "購入金額が安い順" },
  { id: "name_asc", name: "名前順" },
] as const;

export type SortOrderId = (typeof SORT_ORDERS)[number]["id"];

export const DEFAULT_SORT_ORDER: SortOrderId = "created_desc";

export function isSortOrderId(value: unknown): value is SortOrderId {
  return typeof value === "string" && SORT_ORDERS.some((s) => s.id === value);
}
