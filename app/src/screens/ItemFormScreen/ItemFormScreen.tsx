import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { msg } from "../../constants/messages";
import { itemRepository } from "../../repositories/itemRepository";
import { photoRepository } from "../../repositories/photoRepository";
import { useUi } from "../../state/UiContext";
import type { Item, ItemFormValues } from "../../types/models";
import type { NewItemDefaults } from "../ItemListScreen/ItemListScreen";
import { ItemForm } from "./ItemForm";

// SC-05 アイテム登録・編集。編集時はアイテムを読み込んでからフォームを作る（P-05 3.1）
export function ItemFormScreen() {
  const { itemId } = useParams();
  return itemId ? <EditForm itemId={itemId} /> : <NewForm />;
}

const EMPTY_VALUES: ItemFormValues = {
  photos: [],
  name: "",
  categoryId: null,
  subcategoryId: null,
  colorId: null,
  seasons: [],
  brand: "",
  size: "",
  material: "",
  washingMethod: "",
  purchaseDate: "",
  price: "",
  shop: "",
  memo: "",
};

function NewForm() {
  const location = useLocation();
  // 一覧で選択中のカテゴリ・サブカテゴリを初期値にする（SC-05 3章 No.6・7）
  const [initial] = useState<ItemFormValues>(() => {
    const defaults = location.state as NewItemDefaults | null;
    return {
      ...EMPTY_VALUES,
      categoryId: defaults?.categoryId ?? null,
      subcategoryId: defaults?.categoryId
        ? (defaults.subcategoryId ?? null)
        : null,
    };
  });
  return <ItemForm mode="new" initial={initial} />;
}

function EditForm({ itemId }: { itemId: string }) {
  const navigate = useNavigate();
  const { showToast, showError } = useUi();
  const [initial, setInitial] = useState<ItemFormValues | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const item = await itemRepository.get(itemId);
      if (!active) return;
      if (!item) {
        showToast(msg("MSG-E13"));
        navigate("/", { replace: true });
        return;
      }
      // 編集フォームのサムネイルには一覧用画像を使う（P-05 確認事項 No.2）
      const thumbnails = await photoRepository.getThumbnails(item.photoIds);
      if (active) setInitial(toFormValues(item, thumbnails));
    })().catch(() => {
      if (active) showError("MSG-E12");
    });
    return () => {
      active = false;
    };
  }, [itemId, navigate, showToast, showError]);

  return initial ? (
    <ItemForm mode="edit" itemId={itemId} initial={initial} />
  ) : (
    <div className="screen" />
  );
}

function toFormValues(
  item: Item,
  thumbnails: Map<string, Blob>,
): ItemFormValues {
  return {
    photos: item.photoIds.map((photoId) => ({
      key: photoId,
      status: "existing",
      photoId,
      thumbnail: thumbnails.get(photoId) ?? null,
    })),
    name: item.name,
    categoryId: item.categoryId,
    subcategoryId: item.subcategoryId,
    colorId: item.colorId,
    seasons: item.seasons,
    brand: item.brand ?? "",
    size: item.size ?? "",
    material: item.material ?? "",
    washingMethod: item.washingMethod ?? "",
    purchaseDate: item.purchaseDate ?? "",
    price: item.price === null ? "" : String(item.price),
    shop: item.shop ?? "",
    memo: item.memo ?? "",
  };
}
