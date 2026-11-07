// 上限値（要件定義書 5.2、SC-05 3章、SC-08 4章）
export const MAX_PHOTOS = 10;
export const MAX_SUBCATEGORIES_PER_CATEGORY = 30;
// サブカテゴリの表示順の間隔（DB設計書 T-04 5章）
export const SUBCATEGORY_SORT_STEP = 10;

export const MAX_LENGTH = {
  name: 50,
  brand: 50,
  size: 20,
  material: 100,
  washingMethod: 100,
  shop: 100,
  memo: 1000,
  subcategoryName: 20,
  priceDigits: 7,
} as const;

export const MAX_PRICE = 9_999_999;

// 画像処理（P-04）
export const PHOTO_MAX_EDGE = 1280;
export const THUMBNAIL_SIZE = 400;
export const JPEG_QUALITY = 0.8;

// トーストの表示時間（共通仕様 4章）
export const TOAST_DURATION_MS = 2000;

// 前面に戻ったときに新しい版を確認する間隔（M-01 4.2）
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
