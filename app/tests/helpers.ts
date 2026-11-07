import { db } from "../src/db/database";
import type { Item, ItemInput, NewPhoto } from "../src/types/models";

/** テストごとにDBを空にする */
export async function resetDb(): Promise<void> {
  db.close();
  await db.delete();
  await db.open();
}

let seq = 0;

export function makeItem(overrides: Partial<Item> = {}): Item {
  seq += 1;
  return {
    id: `item-${seq}`,
    name: `アイテム${seq}`,
    categoryId: "tops",
    subcategoryId: null,
    colorId: "white",
    brand: null,
    size: null,
    purchaseDate: null,
    price: null,
    shop: null,
    seasons: [],
    material: null,
    washingMethod: null,
    memo: null,
    photoIds: [`photo-${seq}`],
    createdAt: seq,
    updatedAt: seq,
    ...overrides,
  };
}

export function makeInput(overrides: Partial<ItemInput> = {}): ItemInput {
  const item: Partial<Item> = makeItem();
  delete item.id;
  delete item.photoIds;
  delete item.createdAt;
  delete item.updatedAt;
  return { ...(item as ItemInput), ...overrides };
}

export function makeNewPhoto(size = 100): NewPhoto {
  return {
    image: new Blob([new Uint8Array(size)], { type: "image/jpeg" }),
    thumbnail: new Blob([new Uint8Array(size / 10)], { type: "image/jpeg" }),
    width: 1280,
    height: 960,
    byteSize: size,
    thumbnailByteSize: size / 10,
  };
}
