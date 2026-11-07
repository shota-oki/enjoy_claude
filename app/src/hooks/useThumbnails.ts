import { useLiveQuery } from "dexie-react-hooks";
import { photoRepository } from "../repositories/photoRepository";

/** 一覧用画像をまとめて取得する（P-02 3.1 手順4）。読み込み中は undefined */
export function useThumbnails(
  photoIds: readonly string[],
): Map<string, Blob> | undefined {
  const key = photoIds.join(",");
  return useLiveQuery(
    () => photoRepository.getThumbnails(key === "" ? [] : key.split(",")),
    [key],
  );
}
