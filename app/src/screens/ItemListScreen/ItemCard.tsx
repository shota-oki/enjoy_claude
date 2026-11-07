import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { Item } from "../../types/models";
import styles from "./ItemListScreen.module.css";

// SC-01 のカード（代表写真・枚数・名前・分類）
interface Props {
  item: Item;
  thumbnail: Blob | undefined;
  classification: string;
  onOpen: () => void;
}

export function ItemCard({ item, thumbnail, classification, onOpen }: Props) {
  const url = useObjectUrl(thumbnail);
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <div className={styles.thumb}>
        {/* 一覧用画像が見つからない場合は灰色の枠を表示する（P-02 4章） */}
        {url && <img src={url} alt="" />}
        {item.photoIds.length >= 2 && (
          <span className={styles.photoCount}>{item.photoIds.length}枚</span>
        )}
      </div>
      <div className={styles.cardName}>{item.name}</div>
      <div className={styles.cardMeta}>{classification}</div>
    </button>
  );
}
