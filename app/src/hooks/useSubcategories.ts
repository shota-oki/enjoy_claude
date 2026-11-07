import { useLiveQuery } from "dexie-react-hooks";
import { subcategoryRepository } from "../repositories/subcategoryRepository";
import type { Subcategory } from "../types/models";

/**
 * サブカテゴリを表示順で取得し、DBが変更されたら自動で再取得する（P-07）。
 * categoryId を省略すると全件、null なら空。読み込み中は undefined
 */
export function useSubcategories(
  categoryId?: string | null,
): Subcategory[] | undefined {
  const result = useLiveQuery(
    async () => ({
      categoryId,
      list:
        categoryId === null
          ? []
          : categoryId === undefined
            ? await subcategoryRepository.listAll()
            : await subcategoryRepository.listByCategory(categoryId),
    }),
    [categoryId],
  );
  // カテゴリを切り替えた直後は前のカテゴリの結果が返るため、読み込み中として扱う
  return result && result.categoryId === categoryId ? result.list : undefined;
}
