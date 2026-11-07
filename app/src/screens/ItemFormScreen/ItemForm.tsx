import { useMemo, useRef, useState, type ReactNode } from "react";
import { ActionSheet } from "../../components/ActionSheet";
import { ColorPicker } from "../../components/ColorPicker";
import { Dialog } from "../../components/Dialog";
import form from "../../components/Form.module.css";
import { Icon } from "../../components/Icon";
import { NavBar, NavButton } from "../../components/NavBar";
import { SeasonPicker, toggle } from "../../components/SeasonPicker";
import { CATEGORIES, isCategoryId } from "../../constants/categories";
import { MAX_LENGTH, MAX_PHOTOS } from "../../constants/limits";
import { msg, type MessageId } from "../../constants/messages";
import { useGoBack } from "../../hooks/useGoBack";
import { useItemForm } from "../../hooks/useItemForm";
import { useItems } from "../../hooks/useItems";
import { useSubcategories } from "../../hooks/useSubcategories";
import { itemRepository } from "../../repositories/itemRepository";
import {
  toItemInput,
  validate,
  VALIDATION_ORDER,
} from "../../services/itemValidator";
import { listBrands } from "../../services/listQuery";
import { useUi } from "../../state/UiContext";
import type {
  FormPhoto,
  ItemFormField,
  ItemFormValues,
  PhotoSlot,
} from "../../types/models";
import { toDateString } from "../../utils/format";
import { toHalfWidthDigits } from "../../utils/text";
import { logger } from "../../utils/logger";
import { PhotoThumb } from "./PhotoThumb";
import styles from "./ItemFormScreen.module.css";

type Props =
  | { mode: "new"; itemId?: undefined; initial: ItemFormValues }
  | { mode: "edit"; itemId: string; initial: ItemFormValues };

type Sheet = { kind: "add" } | { kind: "photo"; key: string } | null;

export function ItemForm({ mode, itemId, initial }: Props) {
  const goBack = useGoBack();
  const { showToast, showError } = useUi();
  const {
    values,
    errors,
    setErrors,
    setField,
    addPhotos,
    removePhoto,
    makeMain,
    processing,
    isDirty,
  } = useItemForm(initial, {
    onImageError: () => showToast(msg("MSG-E10")),
    onTooMany: (n) => showToast(msg("MSG-E09", { n })),
  });
  const subcategories = useSubcategories(values.categoryId);
  const items = useItems();
  const brands = useMemo(() => (items ? listBrands(items) : []), [items]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  const today = toDateString(new Date());
  const returnPath = mode === "new" ? "/" : `/items/${itemId}`;

  const save = async () => {
    if (saving || processing) return;
    setSaving(true);
    const found = validate(values, today);
    const firstError = VALIDATION_ORDER.find((field) => found[field]);
    if (firstError) {
      setErrors(found);
      showToast(msg("MSG-E07"));
      document
        .getElementById(`field-${firstError}`)
        ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      setSaving(false);
      return;
    }
    const input = toItemInput(values);
    try {
      if (mode === "new") {
        const photos = values.photos.flatMap((p) =>
          p.status === "new" ? [p.photo] : [],
        );
        await itemRepository.create(input, photos);
        showToast(msg("MSG-I01"));
      } else {
        await itemRepository.update(itemId, input, toSlots(values.photos));
        showToast(msg("MSG-I02"));
      }
      goBack(returnPath);
    } catch (error) {
      logger.error("アイテムの保存に失敗しました", error);
      setSaving(false);
      // 入力内容は保持したまま画面に留まる
      showError("MSG-E11");
    }
  };

  const cancel = () => {
    if (isDirty) setConfirmDiscard(true);
    else goBack(returnPath);
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // 同じ写真を続けて選べるように選択状態を戻す
    e.target.value = "";
    void addPhotos(files, values.photos.length);
  };

  const error = (field: ItemFormField): MessageId | undefined => errors[field];

  return (
    <div className="screen">
      <NavBar
        title={mode === "new" ? "アイテム登録" : "アイテム編集"}
        left={<NavButton label="キャンセル" onClick={cancel} />}
        right={
          <NavButton
            label="保存"
            bold
            onClick={save}
            disabled={saving || processing}
          />
        }
      />
      <div className="screen-content">
        {/* 写真 */}
        <div id="field-photos">
          <h3
            className={`${form.sectionTitle} ${error("photos") ? styles.errorLabel : ""}`}
          >
            写真<span className={styles.req}>必須</span>（{values.photos.length}{" "}
            / {MAX_PHOTOS}枚）
          </h3>
          <div className={styles.photoStrip}>
            {values.photos.map((photo, index) => (
              <PhotoThumb
                key={photo.key}
                photo={photo}
                isMain={index === 0}
                label={index === 0 ? "代表写真" : `写真 ${index + 1}枚目`}
                onClick={() => setSheet({ kind: "photo", key: photo.key })}
              />
            ))}
            {values.photos.length < MAX_PHOTOS && (
              <button
                type="button"
                className={`${styles.addPhoto} ${error("photos") ? styles.addPhotoError : ""}`}
                onClick={() => setSheet({ kind: "add" })}
              >
                <Icon name="camera" size={26} strokeWidth={1.8} />
                写真を追加
              </button>
            )}
          </div>
          {error("photos") ? (
            <p className={styles.error}>{msg(error("photos")!)}</p>
          ) : (
            <p className={styles.hint}>
              1枚目が一覧に表示される代表写真になります
            </p>
          )}
        </div>

        {/* 基本情報 */}
        <h3 className={form.sectionTitle}>基本情報</h3>
        <div className={form.group}>
          <Row field="name" label="名前" required error={error("name")}>
            <input
              id="input-name"
              type="text"
              className={styles.input}
              value={values.name}
              maxLength={MAX_LENGTH.name}
              placeholder="例: 白の無地Tシャツ"
              onChange={(e) => setField("name", e.target.value)}
            />
          </Row>
          <Row
            field="categoryId"
            label="カテゴリ"
            required
            error={error("categoryId")}
          >
            <select
              id="input-categoryId"
              className={`${styles.select} ${values.categoryId === null ? styles.placeholder : ""}`}
              value={values.categoryId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setField("categoryId", isCategoryId(value) ? value : null);
                // カテゴリを変えたらサブカテゴリは未選択に戻す
                setField("subcategoryId", null);
              }}
            >
              <option value="" disabled>
                選択してください
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className={form.chev}>
              <Icon name="chev" size={16} strokeWidth={2.4} />
            </span>
          </Row>
          <Row field="subcategoryId" label="サブカテゴリ">
            {values.categoryId === null ? (
              <span className={`${styles.static} ${form.empty}`}>
                先にカテゴリを選択
              </span>
            ) : subcategories && subcategories.length === 0 ? (
              <span className={`${styles.static} ${form.empty}`}>なし</span>
            ) : (
              <>
                <select
                  id="input-subcategoryId"
                  className={`${styles.select} ${values.subcategoryId === null ? styles.placeholder : ""}`}
                  value={values.subcategoryId ?? ""}
                  onChange={(e) =>
                    setField("subcategoryId", e.target.value || null)
                  }
                >
                  <option value="">未選択</option>
                  {(subcategories ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className={form.chev}>
                  <Icon name="chev" size={16} strokeWidth={2.4} />
                </span>
              </>
            )}
          </Row>
          <Row
            field="colorId"
            label="ベースカラー"
            required
            column
            error={error("colorId")}
          >
            <ColorPicker
              isSelected={(id) => values.colorId === id}
              onToggle={(id) => setField("colorId", id)}
            />
          </Row>
          <Row field="seasons" label="季節" column>
            <SeasonPicker
              selected={values.seasons}
              onToggle={(id) => setField("seasons", toggle(values.seasons, id))}
            />
          </Row>
        </div>

        {/* 詳細情報 */}
        <h3 className={form.sectionTitle}>詳細情報</h3>
        <div className={form.group}>
          <BrandRow
            value={values.brand}
            brands={brands}
            onChange={(v) => setField("brand", v)}
          />
          <TextRow
            field="size"
            label="サイズ"
            value={values.size}
            maxLength={MAX_LENGTH.size}
            placeholder="例: M、W32、27.0cm"
            onChange={(v) => setField("size", v)}
          />
          <TextRow
            field="material"
            label="素材"
            value={values.material}
            maxLength={MAX_LENGTH.material}
            placeholder="例: 綿100%"
            onChange={(v) => setField("material", v)}
          />
          <TextRow
            field="washingMethod"
            label="洗濯方法"
            value={values.washingMethod}
            maxLength={MAX_LENGTH.washingMethod}
            placeholder="例: 手洗い、クリーニング"
            onChange={(v) => setField("washingMethod", v)}
          />
        </div>

        {/* 購入情報 */}
        <h3 className={form.sectionTitle}>購入情報</h3>
        <div className={form.group}>
          <Row
            field="purchaseDate"
            label="購入日"
            error={error("purchaseDate")}
          >
            <input
              id="input-purchaseDate"
              type="date"
              className={styles.input}
              value={values.purchaseDate}
              max={today}
              onChange={(e) => setField("purchaseDate", e.target.value)}
            />
            {values.purchaseDate !== "" && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => setField("purchaseDate", "")}
              >
                クリア
              </button>
            )}
          </Row>
          <Row field="price" label="購入金額" error={error("price")}>
            <span className={styles.yen}>¥</span>
            <input
              id="input-price"
              type="text"
              inputMode="numeric"
              className={styles.input}
              value={values.price}
              maxLength={MAX_LENGTH.priceDigits}
              onChange={(e) =>
                setField(
                  "price",
                  // 全角数字は半角にし、数字以外は入力できないようにする
                  toHalfWidthDigits(e.target.value)
                    .replace(/[^0-9]/g, "")
                    .slice(0, MAX_LENGTH.priceDigits),
                )
              }
            />
          </Row>
          <TextRow
            field="shop"
            label="購入店舗"
            value={values.shop}
            maxLength={MAX_LENGTH.shop}
            onChange={(v) => setField("shop", v)}
          />
        </div>

        {/* メモ */}
        <h3 className={form.sectionTitle}>メモ</h3>
        <div className={form.group}>
          <textarea
            aria-label="メモ"
            className={styles.memo}
            value={values.memo}
            maxLength={MAX_LENGTH.memo}
            onChange={(e) => setField("memo", e.target.value)}
          />
        </div>
        <div className={styles.bottomSpace} />
      </div>

      {/* 写真の選択（カメラ／フォトライブラリ） */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        data-testid="camera-input"
        onChange={onFiles}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        data-testid="library-input"
        onChange={onFiles}
      />

      {/* DL-01 写真追加 */}
      {sheet?.kind === "add" && (
        <ActionSheet
          title={`写真を追加（あと${MAX_PHOTOS - values.photos.length}枚）`}
          options={[
            {
              label: "写真を撮る",
              onSelect: () => {
                setSheet(null);
                cameraInput.current?.click();
              },
            },
            {
              label: "フォトライブラリから選択",
              onSelect: () => {
                setSheet(null);
                libraryInput.current?.click();
              },
            },
          ]}
          onCancel={() => setSheet(null)}
        />
      )}

      {/* DL-02 写真操作 */}
      {sheet?.kind === "photo" &&
        (() => {
          const index = values.photos.findIndex((p) => p.key === sheet.key);
          if (index < 0) return null;
          return (
            <ActionSheet
              title={index === 0 ? "代表写真" : `写真 ${index + 1}枚目`}
              options={[
                ...(index > 0
                  ? [
                      {
                        label: "代表写真にする",
                        onSelect: () => {
                          makeMain(sheet.key);
                          setSheet(null);
                        },
                      },
                    ]
                  : []),
                {
                  label: "削除",
                  destructive: true,
                  onSelect: () => {
                    setSheet(null);
                    // 編集では写真を0枚にできない（登録時は保存時にチェックする）
                    if (mode === "edit" && values.photos.length <= 1) {
                      showToast(msg("MSG-E08"));
                      return;
                    }
                    removePhoto(sheet.key);
                  },
                },
              ]}
              onCancel={() => setSheet(null)}
            />
          );
        })()}

      {/* DL-03 入力破棄確認 */}
      {confirmDiscard && (
        <Dialog
          title={msg(mode === "new" ? "MSG-C03" : "MSG-C04")}
          message={msg("MSG-C05")}
          buttons={[
            {
              label: "入力を続ける",
              style: "bold",
              onClick: () => setConfirmDiscard(false),
            },
            {
              label: "破棄",
              style: "destructive",
              onClick: () => goBack(returnPath),
            },
          ]}
        />
      )}
    </div>
  );
}

/** 保存時の写真の並び（P-05 itemRepository.update の入力） */
function toSlots(photos: readonly FormPhoto[]): PhotoSlot[] {
  return photos.flatMap((p): PhotoSlot[] => {
    if (p.status === "existing")
      return [{ kind: "existing", photoId: p.photoId }];
    if (p.status === "new") return [{ kind: "new", photo: p.photo }];
    return [];
  });
}

function Row({
  field,
  label,
  required,
  column,
  error,
  children,
}: {
  field: string;
  label: string;
  required?: boolean;
  column?: boolean;
  error?: MessageId;
  children: ReactNode;
}) {
  return (
    <div id={`field-${field}`}>
      <div
        className={`${form.row} ${styles.row} ${column ? styles.column : ""} ${error ? styles.hasError : ""}`}
      >
        <label className={styles.label} htmlFor={`input-${field}`}>
          {label}
          {required && <span className={styles.req}>必須</span>}
        </label>
        {children}
      </div>
      {error && <p className={styles.inlineError}>{msg(error)}</p>}
    </div>
  );
}

function TextRow({
  field,
  label,
  value,
  maxLength,
  placeholder,
  onChange,
}: {
  field: string;
  label: string;
  value: string;
  maxLength: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Row field={field} label={label}>
      <input
        id={`input-${field}`}
        type="text"
        className={styles.input}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Row>
  );
}

/** ブランド。過去に登録したブランドを部分一致で候補表示する（SC-05 3章 No.10） */
function BrandRow({
  value,
  brands,
  onChange,
}: {
  value: string;
  brands: readonly string[];
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const keyword = value.trim().toLowerCase();
  const candidates =
    focused && keyword !== ""
      ? brands
          .filter((b) => b.toLowerCase().includes(keyword) && b !== value)
          .slice(0, 5)
      : [];
  return (
    <>
      <Row field="brand" label="ブランド">
        <input
          id="input-brand"
          type="text"
          className={styles.input}
          value={value}
          maxLength={MAX_LENGTH.brand}
          autoComplete="off"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
        />
      </Row>
      {candidates.length > 0 && (
        <div
          className={styles.suggestions}
          role="listbox"
          aria-label="ブランドの候補"
        >
          {candidates.map((brand) => (
            <button
              key={brand}
              type="button"
              role="option"
              aria-selected="false"
              className={styles.suggestion}
              // 入力欄のフォーカスが外れる前に選べるよう pointerdown で確定する
              onPointerDown={(e) => {
                e.preventDefault();
                onChange(brand);
              }}
              onClick={() => onChange(brand)}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
