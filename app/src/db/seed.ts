import { CATEGORIES } from "../constants/categories";
import { INITIAL_SUBCATEGORIES } from "../constants/initialSubcategories";
import { SUBCATEGORY_SORT_STEP } from "../constants/limits";
import type { Subcategory } from "../types/models";
import { newId } from "../utils/id";
import { logger } from "../utils/logger";
import { db } from "./database";

export const SEEDED_KEY = "subcategoriesSeeded";

/**
 * 初期サブカテゴリを投入する（P-01 手順2、DB設計書 T-04 5章）。
 * 投入済みの印と同じトランザクションで行い、ユーザーが全件削除しても再投入しない
 */
export async function seed(): Promise<void> {
  await db.transaction("rw", db.subcategories, db.settings, async () => {
    const seeded = await db.settings.get(SEEDED_KEY);
    if (seeded?.value === true) return;

    const now = Date.now();
    const rows: Subcategory[] = CATEGORIES.flatMap((category) =>
      INITIAL_SUBCATEGORIES[category.id].map((name, index) => ({
        id: newId(),
        categoryId: category.id,
        name,
        sortOrder: (index + 1) * SUBCATEGORY_SORT_STEP,
        createdAt: now,
        updatedAt: now,
      })),
    );
    await db.subcategories.bulkAdd(rows);
    await db.settings.put({ key: SEEDED_KEY, value: true });
    logger.info(`初期サブカテゴリを投入しました（${rows.length}件）`);
  });
}
