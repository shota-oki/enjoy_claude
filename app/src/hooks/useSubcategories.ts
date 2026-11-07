import { useLiveQuery } from "dexie-react-hooks";
import { subcategoryRepository } from "../repositories/subcategoryRepository";
import type { Subcategory } from "../types/models";

/**
 * サブカテゴリを表示順で取得し、DBが変更されたら自動で再取得する（P-07）。
 * categoryId を省略すると全件。読み込み中は undefined
 */
export function useSubcategories(
  categoryId?: string | null,
): Subcategory[] | undefined {
  return useLiveQuery(
    () =>
      categoryId
        ? subcategoryRepository.listByCategory(categoryId)
        : categoryId === null
          ? Promise.resolve([])
          : subcategoryRepository.listAll(),
    [categoryId],
  );
}
