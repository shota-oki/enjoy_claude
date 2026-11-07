import type { SortOrderId } from "../constants/sortOrders";
import { type Item, type ListFilter, UNSET_SUBCATEGORY } from "../types/models";
import { compareName } from "../utils/compare";

// 一覧の絞り込み・並び替え・件数計算（P-02）

/** 条件で絞り込む（P-02 3.2。項目間はAND、項目内はOR） */
export function filter(items: readonly Item[], f: ListFilter): Item[] {
  return items.filter((item) => matches(item, f));
}

function matches(item: Item, f: ListFilter): boolean {
  if (f.categoryId !== null && item.categoryId !== f.categoryId) return false;
  if (f.subcategoryId !== null) {
    const expected =
      f.subcategoryId === UNSET_SUBCATEGORY ? null : f.subcategoryId;
    if (item.subcategoryId !== expected) return false;
  }
  if (f.colorIds.length > 0 && !f.colorIds.includes(item.colorId)) return false;
  if (
    f.seasons.length > 0 &&
    !item.seasons.some((s) => f.seasons.includes(s))
  ) {
    return false;
  }
  if (
    f.brands.length > 0 &&
    (item.brand === null || !f.brands.includes(item.brand))
  ) {
    return false;
  }
  return true;
}

type Comparator = (a: Item, b: Item) => number;

/** 値が null のものを末尾にして比べる */
function nullsLast<T>(
  get: (item: Item) => T | null,
  compare: (a: T, b: T) => number,
): Comparator {
  return (a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return compare(va, vb);
  };
}

const asc = <T extends string | number>(a: T, b: T) =>
  a < b ? -1 : a > b ? 1 : 0;
const desc = <T extends string | number>(a: T, b: T) => asc(b, a);

const COMPARATORS: Record<SortOrderId, Comparator> = {
  created_desc: (a, b) => desc(a.createdAt, b.createdAt),
  created_asc: (a, b) => asc(a.createdAt, b.createdAt),
  purchase_desc: nullsLast((i) => i.purchaseDate, desc),
  purchase_asc: nullsLast((i) => i.purchaseDate, asc),
  price_desc: nullsLast((i) => i.price, desc),
  price_asc: nullsLast((i) => i.price, asc),
  name_asc: (a, b) => compareName(a.name, b.name),
};

/** 並び順に従って並べる（P-02 3.3）。同じ値は登録日時の新しい順 */
export function sort(items: readonly Item[], order: SortOrderId): Item[] {
  const primary = COMPARATORS[order];
  return [...items].sort(
    (a, b) => primary(a, b) || desc(a.createdAt, b.createdAt),
  );
}

/** カテゴリごとの件数（カテゴリ・サブカテゴリ以外の条件を反映） */
export function countByCategory(
  items: readonly Item[],
  f: ListFilter,
): Map<string, number> {
  const base = filter(items, { ...f, categoryId: null, subcategoryId: null });
  return countBy(base, (item) => item.categoryId);
}

/** 選択カテゴリ内のサブカテゴリごとの件数（未設定は UNSET_SUBCATEGORY） */
export function countBySubcategory(
  items: readonly Item[],
  f: ListFilter,
): Map<string, number> {
  const base = filter(items, { ...f, subcategoryId: null });
  return countBy(base, (item) => item.subcategoryId ?? UNSET_SUBCATEGORY);
}

function countBy(items: readonly Item[], key: (item: Item) => string) {
  const result = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    result.set(k, (result.get(k) ?? 0) + 1);
  }
  return result;
}

/** 登録済みのブランドを重複なく名前順で返す（完全一致で同じブランドとみなす） */
export function listBrands(items: readonly Item[]): string[] {
  const brands = new Set<string>();
  for (const item of items) {
    if (item.brand !== null) brands.add(item.brand);
  }
  return [...brands].sort(compareName);
}
