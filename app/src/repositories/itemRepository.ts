import { db } from "../db/database";
import type {
  Item,
  ItemInput,
  NewPhoto,
  Photo,
  PhotoSlot,
  Thumbnail,
} from "../types/models";
import { newId } from "../utils/id";
import { NotFoundError } from "./errors";

/** 新しい写真を photos・thumbnails 用のレコードにする */
function toPhotoRecords(
  itemId: string,
  photo: NewPhoto,
  now: number,
): { photo: Photo; thumbnail: Thumbnail } {
  const id = newId();
  return {
    photo: {
      id,
      itemId,
      image: photo.image,
      width: photo.width,
      height: photo.height,
      byteSize: photo.byteSize,
      createdAt: now,
    },
    thumbnail: {
      photoId: id,
      image: photo.thumbnail,
      byteSize: photo.thumbnailByteSize,
    },
  };
}

export const itemRepository = {
  async listAll(): Promise<Item[]> {
    return db.items.toArray();
  },

  async get(itemId: string): Promise<Item | undefined> {
    return db.items.get(itemId);
  },

  async count(): Promise<number> {
    return db.items.count();
  },

  /** アイテムと写真を1トランザクションで登録する（P-05 3.4 手順4） */
  async create(input: ItemInput, photos: readonly NewPhoto[]): Promise<Item> {
    return db.transaction(
      "rw",
      db.items,
      db.photos,
      db.thumbnails,
      async () => {
        const now = Date.now();
        const itemId = newId();
        const records = photos.map((p) => toPhotoRecords(itemId, p, now));
        await db.photos.bulkAdd(records.map((r) => r.photo));
        await db.thumbnails.bulkAdd(records.map((r) => r.thumbnail));
        const item: Item = {
          ...input,
          id: itemId,
          photoIds: records.map((r) => r.photo.id),
          createdAt: now,
          updatedAt: now,
        };
        await db.items.add(item);
        return item;
      },
    );
  },

  /**
   * アイテムと写真を1トランザクションで更新する（P-05 3.4 手順5）。
   * 並びにない既存の写真は削除し、新しい写真は追加する。createdAt は変更しない
   */
  async update(
    itemId: string,
    input: ItemInput,
    slots: readonly PhotoSlot[],
  ): Promise<Item> {
    return db.transaction(
      "rw",
      db.items,
      db.photos,
      db.thumbnails,
      async () => {
        const current = await db.items.get(itemId);
        if (!current) throw new NotFoundError();

        const now = Date.now();
        const newRecords: { photo: Photo; thumbnail: Thumbnail }[] = [];
        const photoIds = slots.map((slot) => {
          if (slot.kind === "existing") return slot.photoId;
          const record = toPhotoRecords(itemId, slot.photo, now);
          newRecords.push(record);
          return record.photo.id;
        });

        const kept = new Set(photoIds);
        const removed = current.photoIds.filter((id) => !kept.has(id));

        await db.photos.bulkAdd(newRecords.map((r) => r.photo));
        await db.thumbnails.bulkAdd(newRecords.map((r) => r.thumbnail));
        await db.photos.bulkDelete(removed);
        await db.thumbnails.bulkDelete(removed);

        const item: Item = {
          ...input,
          id: itemId,
          photoIds,
          createdAt: current.createdAt,
          updatedAt: now,
        };
        await db.items.put(item);
        return item;
      },
    );
  },

  /**
   * アイテムと写真・一覧用画像を1トランザクションで削除する（P-06）。
   * photoIds と photos が食い違っていても写真が残らないよう、photos.itemId で検索する
   */
  async remove(itemId: string): Promise<void> {
    await db.transaction("rw", db.items, db.photos, db.thumbnails, async () => {
      const photoIds = (await db.photos
        .where("itemId")
        .equals(itemId)
        .primaryKeys()) as string[];
      await db.thumbnails.bulkDelete(photoIds);
      await db.photos.bulkDelete(photoIds);
      await db.items.delete(itemId);
    });
  },

  /** カテゴリ内のサブカテゴリごとのアイテム件数（P-09） */
  async countBySubcategory(categoryId: string): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    await db.items
      .where("categoryId")
      .equals(categoryId)
      .each((item) => {
        if (item.subcategoryId === null) return;
        result.set(
          item.subcategoryId,
          (result.get(item.subcategoryId) ?? 0) + 1,
        );
      });
    return result;
  },
};
