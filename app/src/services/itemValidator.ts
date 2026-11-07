import { MAX_PRICE } from "../constants/limits";
import type { MessageId } from "../constants/messages";
import { sortSeasons } from "../constants/seasons";
import type { ItemFormField, ItemFormValues, ItemInput } from "../types/models";
import { toNullableText, trimText } from "../utils/text";

export type ValidationErrors = Partial<Record<ItemFormField, MessageId>>;

/** チェックする順（最初のエラー項目へのスクロールに使う） */
export const VALIDATION_ORDER: readonly ItemFormField[] = [
  "photos",
  "name",
  "categoryId",
  "colorId",
  "price",
  "purchaseDate",
];

/**
 * 入力チェック（SC-05 5章、P-05 3.2）。
 * 最初のエラーで止めず、すべての項目をチェックする
 * @param today 今日の日付（YYYY-MM-DD）
 */
export function validate(
  values: ItemFormValues,
  today: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const readyPhotos = values.photos.filter((p) => p.status !== "processing");
  if (readyPhotos.length === 0) errors.photos = "MSG-E01";
  if (trimText(values.name) === "") errors.name = "MSG-E02";
  if (values.categoryId === null) errors.categoryId = "MSG-E03";
  if (values.colorId === null) errors.colorId = "MSG-E04";

  const price = trimText(values.price);
  if (price !== "" && !(/^\d+$/.test(price) && Number(price) <= MAX_PRICE)) {
    errors.price = "MSG-E05";
  }
  if (values.purchaseDate !== "" && values.purchaseDate > today) {
    errors.purchaseDate = "MSG-E06";
  }
  return errors;
}

/** フォームの値を保存用の値に変換する（P-05 3.3）。validate を通過した値に対して使う */
export function toItemInput(values: ItemFormValues): ItemInput {
  if (values.categoryId === null || values.colorId === null) {
    throw new Error("validate を通過していない値です");
  }
  const price = trimText(values.price);
  return {
    name: trimText(values.name),
    categoryId: values.categoryId,
    subcategoryId: values.subcategoryId,
    colorId: values.colorId,
    brand: toNullableText(values.brand),
    size: toNullableText(values.size),
    purchaseDate: values.purchaseDate === "" ? null : values.purchaseDate,
    price: price === "" ? null : Number(price),
    shop: toNullableText(values.shop),
    seasons: sortSeasons(values.seasons),
    material: toNullableText(values.material),
    washingMethod: toNullableText(values.washingMethod),
    memo: toNullableText(values.memo),
  };
}
