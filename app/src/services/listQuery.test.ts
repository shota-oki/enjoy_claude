import {
  EMPTY_FILTER,
  UNSET_SUBCATEGORY,
  type ListFilter,
} from "../types/models";
import {
  countByCategory,
  countBySubcategory,
  filter,
  listBrands,
  sort,
} from "./listQuery";
import { makeItem } from "../../tests/helpers";

const f = (overrides: Partial<ListFilter>): ListFilter => ({
  ...EMPTY_FILTER,
  ...overrides,
});

describe("filter", () => {
  const a = makeItem({
    categoryId: "tops",
    subcategoryId: "s1",
    colorId: "white",
    seasons: ["spring"],
    brand: "UNIQLO",
  });
  const b = makeItem({
    categoryId: "tops",
    subcategoryId: null,
    colorId: "black",
    seasons: ["summer", "winter"],
    brand: "ユニクロ",
  });
  const c = makeItem({
    categoryId: "bottoms",
    subcategoryId: "s2",
    colorId: "navy",
    seasons: [],
    brand: null,
  });
  const items = [a, b, c];

  it("条件なしなら全件", () => {
    expect(filter(items, EMPTY_FILTER)).toEqual(items);
  });

  it("カテゴリ・サブカテゴリ・未設定", () => {
    expect(filter(items, f({ categoryId: "tops" }))).toEqual([a, b]);
    expect(
      filter(items, f({ categoryId: "tops", subcategoryId: "s1" })),
    ).toEqual([a]);
    expect(
      filter(
        items,
        f({ categoryId: "tops", subcategoryId: UNSET_SUBCATEGORY }),
      ),
    ).toEqual([b]);
  });

  it("項目内はOR", () => {
    expect(filter(items, f({ colorIds: ["white", "navy"] }))).toEqual([a, c]);
    expect(filter(items, f({ seasons: ["winter", "spring"] }))).toEqual([a, b]);
    expect(filter(items, f({ brands: ["UNIQLO", "ユニクロ"] }))).toEqual([
      a,
      b,
    ]);
  });

  it("項目間はAND", () => {
    expect(
      filter(items, f({ colorIds: ["white", "black"], seasons: ["summer"] })),
    ).toEqual([b]);
    expect(
      filter(items, f({ categoryId: "bottoms", colorIds: ["white"] })),
    ).toEqual([]);
  });

  it("ブランドは完全一致", () => {
    expect(filter(items, f({ brands: ["uniqlo"] }))).toEqual([]);
  });
});

describe("sort", () => {
  it("登録日の新しい順・古い順", () => {
    const x = makeItem({ createdAt: 1 });
    const y = makeItem({ createdAt: 2 });
    expect(sort([x, y], "created_desc")).toEqual([y, x]);
    expect(sort([y, x], "created_asc")).toEqual([x, y]);
  });

  it("購入日：未入力は末尾、同値は登録日の新しい順", () => {
    const n = makeItem({ purchaseDate: null, createdAt: 10 });
    const old = makeItem({ purchaseDate: "2025-01-01", createdAt: 1 });
    const new1 = makeItem({ purchaseDate: "2026-01-01", createdAt: 2 });
    const new2 = makeItem({ purchaseDate: "2026-01-01", createdAt: 3 });
    expect(sort([n, old, new1, new2], "purchase_desc")).toEqual([
      new2,
      new1,
      old,
      n,
    ]);
    expect(sort([n, new1, old, new2], "purchase_asc")).toEqual([
      old,
      new2,
      new1,
      n,
    ]);
  });

  it("購入金額：未入力は末尾、0円は値として扱う", () => {
    const n = makeItem({ price: null });
    const zero = makeItem({ price: 0 });
    const high = makeItem({ price: 5000 });
    expect(sort([n, zero, high], "price_desc")).toEqual([high, zero, n]);
    expect(sort([n, high, zero], "price_asc")).toEqual([zero, high, n]);
  });

  it("名前順：英字は日本語の後", () => {
    const en = makeItem({ name: "Apple" });
    const ja = makeItem({ name: "あ" });
    const ka = makeItem({ name: "か" });
    expect(sort([en, ka, ja], "name_asc")).toEqual([ja, ka, en]);
  });

  it("元の配列を変更しない", () => {
    const items = [makeItem({ createdAt: 1 }), makeItem({ createdAt: 2 })];
    const copy = [...items];
    sort(items, "created_desc");
    expect(items).toEqual(copy);
  });
});

describe("件数・ブランド", () => {
  const items = [
    makeItem({ categoryId: "tops", subcategoryId: "s1", colorId: "white" }),
    makeItem({ categoryId: "tops", subcategoryId: null, colorId: "white" }),
    makeItem({ categoryId: "tops", subcategoryId: "s1", colorId: "black" }),
    makeItem({ categoryId: "bag", subcategoryId: null, colorId: "white" }),
  ];

  it("カテゴリ件数は絞り込み条件を反映し、カテゴリ・サブカテゴリの選択は無視する", () => {
    const counts = countByCategory(
      items,
      f({ categoryId: "bag", subcategoryId: "s9", colorIds: ["white"] }),
    );
    expect(counts.get("tops")).toBe(2);
    expect(counts.get("bag")).toBe(1);
  });

  it("サブカテゴリ件数は選択カテゴリ内で数え、未設定も数える", () => {
    const counts = countBySubcategory(
      items,
      f({ categoryId: "tops", subcategoryId: "s1" }),
    );
    expect(counts.get("s1")).toBe(2);
    expect(counts.get(UNSET_SUBCATEGORY)).toBe(1);
  });

  it("ブランドは重複を除いて名前順", () => {
    const list = listBrands([
      makeItem({ brand: "UNIQLO" }),
      makeItem({ brand: "ユニクロ" }),
      makeItem({ brand: "UNIQLO" }),
      makeItem({ brand: null }),
      makeItem({ brand: "あ" }),
    ]);
    expect(list).toEqual(["あ", "ユニクロ", "UNIQLO"]);
  });
});
