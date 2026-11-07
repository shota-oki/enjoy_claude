import type { CategoryId } from "../constants/categories";
import type { ColorId } from "../constants/colors";
import type { SeasonId } from "../constants/seasons";

// DB設計書 T-01
export interface Item {
  id: string;
  name: string;
  categoryId: CategoryId;
  subcategoryId: string | null;
  colorId: ColorId;
  brand: string | null;
  size: string | null;
  purchaseDate: string | null; // YYYY-MM-DD
  price: number | null;
  shop: string | null;
  seasons: SeasonId[];
  material: string | null;
  washingMethod: string | null;
  memo: string | null;
  photoIds: string[];
  createdAt: number;
  updatedAt: number;
}

/** 保存用の値（P-05 toItemInput の出力）。ID・写真・日時以外の項目 */
export type ItemInput = Omit<
  Item,
  "id" | "photoIds" | "createdAt" | "updatedAt"
>;

// DB設計書 T-02
export interface Photo {
  id: string;
  itemId: string;
  image: Blob;
  width: number;
  height: number;
  byteSize: number;
  createdAt: number;
}

// DB設計書 T-03
export interface Thumbnail {
  photoId: string;
  image: Blob;
  byteSize: number;
}

// DB設計書 T-04
export interface Subcategory {
  id: string;
  categoryId: CategoryId;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

// DB設計書 T-05
export interface Setting {
  key: string;
  value: unknown;
}

/** 取り込み済みでまだ保存していない写真（P-04 imageProcessor.process の出力） */
export interface NewPhoto {
  image: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  byteSize: number;
  thumbnailByteSize: number;
}

/** 保存時の写真の並び。既存の写真はID、新しく追加した写真は NewPhoto */
export type PhotoSlot =
  { kind: "existing"; photoId: string } | { kind: "new"; photo: NewPhoto };

/** 登録・編集フォームの写真（P-04・P-05） */
export type FormPhoto =
  | { key: string; status: "existing"; photoId: string; thumbnail: Blob | null }
  | { key: string; status: "new"; photo: NewPhoto }
  | { key: string; status: "processing" };

/** 登録・編集フォームの値（SC-05）。テキストは入力されたままの文字列で持つ */
export interface ItemFormValues {
  photos: FormPhoto[];
  name: string;
  categoryId: CategoryId | null;
  subcategoryId: string | null;
  colorId: ColorId | null;
  seasons: SeasonId[];
  brand: string;
  size: string;
  material: string;
  washingMethod: string;
  purchaseDate: string; // YYYY-MM-DD または空
  price: string;
  shop: string;
  memo: string;
}

export type ItemFormField = Exclude<keyof ItemFormValues, "seasons">;

/** 「未設定」サブカテゴリを表す選択値（SC-01 チップ） */
export const UNSET_SUBCATEGORY = "__unset__";

/** 一覧の条件（SC-01 のチップと SC-02 の絞り込み条件） */
export interface ListFilter {
  categoryId: CategoryId | null; // null: すべて
  subcategoryId: string | null; // null: すべて、UNSET_SUBCATEGORY: 未設定
  colorIds: ColorId[];
  seasons: SeasonId[];
  brands: string[];
}

export const EMPTY_FILTER: ListFilter = {
  categoryId: null,
  subcategoryId: null,
  colorIds: [],
  seasons: [],
  brands: [],
};
