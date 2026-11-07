import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { FormPhoto } from "../../types/models";
import styles from "./ItemFormScreen.module.css";

// SC-05 の写真サムネイル。処理中はスピナーを表示し、タップできない
interface Props {
  photo: FormPhoto;
  isMain: boolean;
  label: string;
  onClick: () => void;
}

export function PhotoThumb({ photo, isMain, label, onClick }: Props) {
  const blob =
    photo.status === "new"
      ? photo.photo.thumbnail
      : photo.status === "existing"
        ? photo.thumbnail
        : null;
  const url = useObjectUrl(blob);

  if (photo.status === "processing") {
    return (
      <div className={styles.photoItem} role="status" aria-label="写真を処理中">
        <span className={styles.spinner} />
      </div>
    );
  }
  return (
    <button
      type="button"
      className={styles.photoItem}
      aria-label={label}
      onClick={onClick}
    >
      {url && <img src={url} alt="" />}
      {isMain && <span className={styles.mainBadge}>代表</span>}
    </button>
  );
}
