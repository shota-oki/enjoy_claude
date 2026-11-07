import Dexie from "dexie";
import type { CategoryId } from "../constants/categories";
import {
  MAX_SUBCATEGORIES_PER_CATEGORY,
  SUBCATEGORY_SORT_STEP,
} from "../constants/limits";
import { db } from "../db/database";
import type { Subcategory } from "../types/models";
import { newId } from "../utils/id";
import { InUseError, LimitExceededError } from "./errors";

export const subcategoryRepository = {
  /** カテゴリのサブカテゴリを表示順で取得する */
  async listByCategory(categoryId: string): Promise<Subcategory[]> {
    return db.subcategories
      .where("[categoryId+sortOrder]")
      .between([categoryId, Dexie.minKey], [categoryId, Dexie.maxKey])
      .toArray();
  },

  /** 全サブカテゴリを取得する（カテゴリ・表示順の順） */
  async listAll(): Promise<Subcategory[]> {
    return db.subcategories.orderBy("[categoryId+sortOrder]").toArray();
  },

  /**
   * 末尾に追加する（P-07 3.1）。30件以上なら LimitExceededError。
   * 名前の重複は [categoryId+name] の一意制約により ConstraintError となる
   */
  async add(categoryId: CategoryId, name: string): Promise<Subcategory> {
    return db.transaction("rw", db.subcategories, async () => {
      const current = await subcategoryRepository.listByCategory(categoryId);
      if (current.length >= MAX_SUBCATEGORIES_PER_CATEGORY) {
        throw new LimitExceededError();
      }
      const maxOrder = current.reduce(
        (max, s) => Math.max(max, s.sortOrder),
        0,
      );
      const now = Date.now();
      const row: Subcategory = {
        id: newId(),
        categoryId,
        name,
        sortOrder: maxOrder + SUBCATEGORY_SORT_STEP,
        createdAt: now,
        updatedAt: now,
      };
      await db.subcategories.add(row);
      return row;
    });
  },

  /** 名称を変更する（P-07 3.2）。アイテムはIDで参照しているため更新しない */
  async rename(subcategoryId: string, name: string): Promise<void> {
    await db.subcategories.update(subcategoryId, {
      name,
      updatedAt: Date.now(),
    });
  },

  /** 2件の表示順を入れ替える（P-08） */
  async swapOrder(subcategoryId: string, otherId: string): Promise<void> {
    await db.transaction("rw", db.subcategories, async () => {
      const [a, b] = await db.subcategories.bulkGet([subcategoryId, otherId]);
      if (!a || !b) return;
      const now = Date.now();
      await db.subcategories.update(a.id, {
        sortOrder: b.sortOrder,
        updatedAt: now,
      });
      await db.subcategories.update(b.id, {
        sortOrder: a.sortOrder,
        updatedAt: now,
      });
    });
  },

  /**
   * アイテムが0件であることを同じトランザクション内で確認して削除する（P-09）。
   * 1件以上なら InUseError。すでに存在しない場合は何もしない
   */
  async remove(subcategoryId: string): Promise<void> {
    await db.transaction("rw", db.items, db.subcategories, async () => {
      const count = await db.items
        .where("subcategoryId")
        .equals(subcategoryId)
        .count();
      if (count > 0) throw new InUseError(count);
      await db.subcategories.delete(subcategoryId);
    });
  },
};
