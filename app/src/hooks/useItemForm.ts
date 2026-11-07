import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PHOTOS } from "../constants/limits";
import { sortSeasons } from "../constants/seasons";
import { process as processImage } from "../services/imageProcessor";
import type { ValidationErrors } from "../services/itemValidator";
import type { FormPhoto, ItemFormValues } from "../types/models";
import { newId } from "../utils/id";
import { logger } from "../utils/logger";

// 登録・編集フォームの状態管理（処理設計書 共通 7章、P-04、P-05）

interface Callbacks {
  /** 写真を読み込めなかった（MSG-E10） */
  onImageError: () => void;
  /** 上限を超えたため先頭から n 枚だけ追加した（MSG-E09） */
  onTooMany: (added: number) => void;
}

/** 変更有無の判定用に値をそろえる（写真は並び、季節は春→冬の順で比べる） */
function snapshot(values: ItemFormValues): string {
  return JSON.stringify({
    ...values,
    photos: values.photos.map((p) =>
      p.status === "existing" ? p.photoId : p.key,
    ),
    seasons: sortSeasons(values.seasons),
  });
}

export function useItemForm(initial: ItemFormValues, callbacks: Callbacks) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [initialSnapshot] = useState(() => snapshot(initial));
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  // 処理中にフォームを閉じた場合は、処理中の写真を破棄する（P-04 4章）
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setField = useCallback(
    <K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      // 修正した時点でその項目のエラー表示を消す（共通仕様 5章）
      setErrors((e) => (key in e ? { ...e, [key]: undefined } : e));
    },
    [],
  );

  const setPhotos = useCallback((update: (p: FormPhoto[]) => FormPhoto[]) => {
    setValues((v) => ({ ...v, photos: update(v.photos) }));
    setErrors((e) => (e.photos ? { ...e, photos: undefined } : e));
  }, []);

  /** 選ばれた写真を1枚ずつ順に変換し、末尾に追加する（P-04 3.2） */
  const addPhotos = useCallback(
    async (files: readonly File[], currentCount: number) => {
      const remaining = MAX_PHOTOS - currentCount;
      if (files.length === 0 || remaining <= 0) return;
      const targets = files.slice(0, remaining);
      const slots = targets.map((file) => ({ file, key: newId() }));
      setPhotos((photos) => [
        ...photos,
        ...slots.map((s): FormPhoto => ({ key: s.key, status: "processing" })),
      ]);

      for (const slot of slots) {
        try {
          const photo = await processImage(slot.file);
          if (!mounted.current) return;
          setPhotos((photos) =>
            photos.map((p) =>
              p.key === slot.key ? { key: slot.key, status: "new", photo } : p,
            ),
          );
        } catch (error) {
          if (!mounted.current) return;
          logger.warn("写真を読み込めませんでした", error);
          setPhotos((photos) => photos.filter((p) => p.key !== slot.key));
          callbacksRef.current.onImageError();
        }
      }
      if (files.length > remaining) callbacksRef.current.onTooMany(remaining);
    },
    [setPhotos],
  );

  /** 写真を取り除く。1枚目を取り除いた場合は2枚目が代表になる */
  const removePhoto = useCallback(
    (key: string) => setPhotos((photos) => photos.filter((p) => p.key !== key)),
    [setPhotos],
  );

  /** 写真を先頭（代表写真）に移動する。他の写真の順序は保つ */
  const makeMain = useCallback(
    (key: string) =>
      setPhotos((photos) => {
        const target = photos.find((p) => p.key === key);
        return target
          ? [target, ...photos.filter((p) => p.key !== key)]
          : photos;
      }),
    [setPhotos],
  );

  const processing = values.photos.some((p) => p.status === "processing");
  const isDirty = snapshot(values) !== initialSnapshot;

  return {
    values,
    errors,
    setErrors,
    setField,
    addPhotos,
    removePhoto,
    makeMain,
    processing,
    isDirty,
  };
}
