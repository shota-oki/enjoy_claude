import type { ItemFormValues } from "../types/models";
import { toItemInput, validate } from "./itemValidator";
import { makeNewPhoto } from "../../tests/helpers";

const TODAY = "2026-11-07";

function values(overrides: Partial<ItemFormValues> = {}): ItemFormValues {
  return {
    photos: [{ key: "p1", status: "new", photo: makeNewPhoto() }],
    name: "白T",
    categoryId: "tops",
    subcategoryId: null,
    colorId: "white",
    seasons: [],
    brand: "",
    size: "",
    material: "",
    washingMethod: "",
    purchaseDate: "",
    price: "",
    shop: "",
    memo: "",
    ...overrides,
  };
}

describe("validate", () => {
  it("正しい値ならエラーなし", () => {
    expect(validate(values(), TODAY)).toEqual({});
  });

  it("必須項目の未入力をすべてまとめて返す", () => {
    const errors = validate(
      values({ photos: [], name: "", categoryId: null, colorId: null }),
      TODAY,
    );
    expect(errors).toEqual({
      photos: "MSG-E01",
      name: "MSG-E02",
      categoryId: "MSG-E03",
      colorId: "MSG-E04",
    });
  });

  it("処理中の写真は数えない", () => {
    const errors = validate(
      values({ photos: [{ key: "x", status: "processing" }] }),
      TODAY,
    );
    expect(errors.photos).toBe("MSG-E01");
  });

  it("名前が空白（全角含む）のみはエラー", () => {
    expect(validate(values({ name: " 　 " }), TODAY).name).toBe("MSG-E02");
  });

  it.each([
    ["0", undefined],
    ["9999999", undefined],
    ["10000000", "MSG-E05"],
    ["1.5", "MSG-E05"],
    ["-1", "MSG-E05"],
    ["abc", "MSG-E05"],
  ])("購入金額 %s", (price, expected) => {
    expect(validate(values({ price }), TODAY).price).toBe(expected);
  });

  it.each([
    ["2026-11-07", undefined],
    ["2026-11-08", "MSG-E06"],
    ["2020-01-01", undefined],
  ])("購入日 %s", (purchaseDate, expected) => {
    expect(validate(values({ purchaseDate }), TODAY).purchaseDate).toBe(
      expected,
    );
  });
});

describe("toItemInput", () => {
  it("空文字は null、金額は数値、季節は春→冬の順にする", () => {
    const input = toItemInput(
      values({
        name: "  白T ",
        brand: "　",
        size: " M ",
        price: "1200",
        seasons: ["winter", "spring", "winter"],
        memo: "a\nb",
      }),
    );
    expect(input).toMatchObject({
      name: "白T",
      brand: null,
      size: "M",
      price: 1200,
      purchaseDate: null,
      seasons: ["spring", "winter"],
      memo: "a\nb",
      subcategoryId: null,
    });
  });

  it("金額0は0のまま", () => {
    expect(toItemInput(values({ price: "0" })).price).toBe(0);
  });
});
