import Dexie, { type Table } from "dexie";
import type {
  Item,
  Photo,
  Setting,
  Subcategory,
  Thumbnail,
} from "../types/models";

// DB設計書 共通 9章
export const DB_NAME = "closet-app";

export class ClosetDatabase extends Dexie {
  items!: Table<Item, string>;
  photos!: Table<Photo, string>;
  thumbnails!: Table<Thumbnail, string>;
  subcategories!: Table<Subcategory, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super(DB_NAME);
    // スキーマを変える場合は version を上げて upgrade を書く。既存の定義は削除しない
    this.version(1).stores({
      items: "id, categoryId, subcategoryId, createdAt",
      photos: "id, itemId",
      thumbnails: "photoId",
      subcategories:
        "id, categoryId, &[categoryId+name], [categoryId+sortOrder]",
      settings: "key",
    });
  }
}

export const db = new ClosetDatabase();
