import { useLiveQuery } from "dexie-react-hooks";
import { itemRepository } from "../repositories/itemRepository";
import type { Item } from "../types/models";

/** 全アイテムを取得し、DBが変更されたら自動で再取得する（P-02）。読み込み中は undefined */
export function useItems(): Item[] | undefined {
  return useLiveQuery(() => itemRepository.listAll(), []);
}
