import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog } from "../../components/Dialog";
import form from "../../components/Form.module.css";
import { NavBar, NavButton } from "../../components/NavBar";
import { Swatch } from "../../components/Swatch";
import { getCategoryName } from "../../constants/categories";
import { getColor } from "../../constants/colors";
import { msg } from "../../constants/messages";
import { getSeasonName, sortSeasons } from "../../constants/seasons";
import { useGoBack } from "../../hooks/useGoBack";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { itemRepository } from "../../repositories/itemRepository";
import { photoRepository } from "../../repositories/photoRepository";
import { subcategoryRepository } from "../../repositories/subcategoryRepository";
import { useUi } from "../../state/UiContext";
import type { Item } from "../../types/models";
import {
  formatDateString,
  formatPrice,
  formatTimestamp,
} from "../../utils/format";
import { logger } from "../../utils/logger";
import styles from "./ItemDetailScreen.module.css";

// SC-04 アイテム詳細（DL-04 アイテム削除確認を含む）
export function ItemDetailScreen() {
  const { itemId = "" } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { showToast, showError } = useUi();
  // 読み込み中は undefined、存在しない場合は null
  const item = useLiveQuery(
    async () => (await itemRepository.get(itemId)) ?? null,
    [itemId],
  );
  const subcategoryName = useLiveQuery(async () => {
    if (!item?.subcategoryId) return null;
    const subs = await subcategoryRepository.listByCategory(item.categoryId);
    return subs.find((s) => s.id === item.subcategoryId)?.name ?? null;
  }, [item?.categoryId, item?.subcategoryId]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 自分で削除した直後に「見つかりませんでした」を出さないようにする
  const deleted = useRef(false);

  useEffect(() => {
    if (item === null && !deleted.current) {
      showToast(msg("MSG-E13"));
      navigate("/", { replace: true });
    }
  }, [item, navigate, showToast]);

  const remove = async () => {
    setDeleting(true);
    deleted.current = true;
    try {
      await itemRepository.remove(itemId);
      showToast(msg("MSG-I03"));
      goBack("/");
    } catch (error) {
      deleted.current = false;
      logger.error("アイテムの削除に失敗しました", error);
      setDeleting(false);
      setConfirming(false);
      showError("MSG-E11");
    }
  };

  return (
    <div className="screen">
      <NavBar
        left={<NavButton label="戻る" back onClick={() => goBack("/")} />}
        right={
          item && (
            <NavButton
              label="編集"
              onClick={() => navigate(`/items/${itemId}/edit`)}
            />
          )
        }
      />
      <div className="screen-content">
        {item && (
          <ItemDetail
            item={item}
            subcategoryName={subcategoryName ?? null}
            onDelete={() => setConfirming(true)}
          />
        )}
      </div>
      {confirming && item && (
        <Dialog
          title={msg("MSG-C01")}
          message={msg("MSG-C02", { name: item.name })}
          buttons={[
            {
              label: "キャンセル",
              onClick: () => setConfirming(false),
              disabled: deleting,
            },
            {
              label: "削除",
              style: "destructiveBold",
              onClick: remove,
              disabled: deleting,
            },
          ]}
        />
      )}
    </div>
  );
}

function ItemDetail({
  item,
  subcategoryName,
  onDelete,
}: {
  item: Item;
  subcategoryName: string | null;
  onDelete: () => void;
}) {
  const color = getColor(item.colorId);
  const categoryName = getCategoryName(item.categoryId);
  return (
    <>
      <PhotoCarousel photoIds={item.photoIds} />
      <div className={styles.head}>
        <h2>{item.name}</h2>
        <div className={styles.path}>
          {subcategoryName
            ? `${categoryName} › ${subcategoryName}`
            : categoryName}
        </div>
      </div>
      <div className={styles.tags}>
        <span className={styles.pill}>
          <Swatch colorId={item.colorId} />
          {color?.name}
        </span>
        {sortSeasons(item.seasons).map((s) => (
          <span key={s} className={styles.pill}>
            {getSeasonName(s)}
          </span>
        ))}
      </div>

      <h3 className={form.sectionTitle}>基本情報</h3>
      <div className={form.group}>
        <Field label="ブランド" value={item.brand} />
        <Field label="サイズ" value={item.size} />
        <Field label="素材" value={item.material} />
        <Field label="洗濯方法" value={item.washingMethod} />
      </div>

      <h3 className={form.sectionTitle}>購入情報</h3>
      <div className={form.group}>
        <Field
          label="購入日"
          value={item.purchaseDate && formatDateString(item.purchaseDate)}
        />
        <Field
          label="購入金額"
          value={item.price === null ? null : formatPrice(item.price)}
        />
        <Field label="購入店舗" value={item.shop} />
      </div>

      <h3 className={form.sectionTitle}>メモ</h3>
      <div className={form.group}>
        <p className={`${styles.memo} ${item.memo ? "" : form.empty}`}>
          {item.memo ?? "未入力"}
        </p>
      </div>

      <button type="button" className={styles.dangerButton} onClick={onDelete}>
        このアイテムを削除
      </button>
      <p className={styles.stamp}>
        <span>登録日 {formatTimestamp(item.createdAt)}</span>
        <span className={styles.stampGap}>
          更新日 {formatTimestamp(item.updatedAt)}
        </span>
      </p>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={form.row}>
      <span className={form.label}>{label}</span>
      <span className={`${form.value} ${value === null ? form.empty : ""}`}>
        {value ?? "未入力"}
      </span>
    </div>
  );
}

/** 写真を横スワイプで切り替える。写真全体が収まるように表示する */
function PhotoCarousel({ photoIds }: { photoIds: string[] }) {
  const [index, setIndex] = useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.clientWidth > 0)
      setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <>
      <div className={styles.carouselWrap}>
        <div className={styles.carousel} onScroll={onScroll}>
          {photoIds.map((id, i) => (
            <PhotoSlide key={id} photoId={id} label={`写真 ${i + 1}枚目`} />
          ))}
        </div>
        {photoIds.length >= 2 && (
          <span className={styles.pager}>
            {index + 1} / {photoIds.length}
          </span>
        )}
      </div>
      {photoIds.length >= 2 && (
        <div className={styles.dots} aria-hidden="true">
          {photoIds.map((id, i) => (
            <span key={id} className={i === index ? styles.dotOn : ""} />
          ))}
        </div>
      )}
    </>
  );
}

function PhotoSlide({ photoId, label }: { photoId: string; label: string }) {
  const image = useLiveQuery(
    () => photoRepository.getImage(photoId),
    [photoId],
  );
  const url = useObjectUrl(image);
  return (
    <div className={styles.slide}>{url && <img src={url} alt={label} />}</div>
  );
}
