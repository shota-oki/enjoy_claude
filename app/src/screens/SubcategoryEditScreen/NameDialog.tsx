import { useState } from "react";
import { Dialog } from "../../components/Dialog";
import { getCategoryName, type CategoryId } from "../../constants/categories";
import { MAX_LENGTH } from "../../constants/limits";
import { msg, type MessageId } from "../../constants/messages";
import {
  isConstraintError,
  LimitExceededError,
} from "../../repositories/errors";
import { subcategoryRepository } from "../../repositories/subcategoryRepository";
import { useUi } from "../../state/UiContext";
import type { Subcategory } from "../../types/models";
import { logger } from "../../utils/logger";
import { trimText } from "../../utils/text";
import styles from "./SubcategoryEditScreen.module.css";

// DL-05 サブカテゴリ名入力（追加・名称変更。P-07）
interface Props {
  mode: "add" | "rename";
  categoryId: CategoryId;
  subcategory?: Subcategory;
  existing: readonly Subcategory[];
  onClose: () => void;
}

export function NameDialog({
  mode,
  categoryId,
  subcategory,
  existing,
  onClose,
}: Props) {
  const { showToast, showError } = useUi();
  const [name, setName] = useState(subcategory?.name ?? "");
  const [error, setError] = useState<MessageId | null>(null);
  const [saving, setSaving] = useState(false);
  const trimmed = trimText(name);
  // 名称が空（空白のみを含む）の間は確定できない
  const canSubmit = trimmed !== "" && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    if (mode === "rename" && trimmed === subcategory?.name) {
      onClose();
      return;
    }
    // 同じカテゴリ内の同じ名前（名称変更時は自分自身を除く）
    if (existing.some((s) => s.name === trimmed && s.id !== subcategory?.id)) {
      setError("MSG-E14");
      return;
    }
    setSaving(true);
    try {
      if (mode === "add") {
        await subcategoryRepository.add(categoryId, trimmed);
        showToast(msg("MSG-I04"));
      } else {
        await subcategoryRepository.rename(subcategory!.id, trimmed);
        showToast(msg("MSG-I05"));
      }
      onClose();
    } catch (e) {
      setSaving(false);
      if (isConstraintError(e)) {
        setError("MSG-E14");
      } else if (e instanceof LimitExceededError) {
        // 別の操作で件数が増えていた場合
        onClose();
        showToast(msg("MSG-E15"));
      } else {
        // ダイアログは閉じずに MSG-E11 を重ねて表示する
        logger.error("サブカテゴリの保存に失敗しました", e);
        showError("MSG-E11");
      }
    }
  };

  return (
    <Dialog
      title={msg(mode === "add" ? "MSG-C06" : "MSG-C08")}
      message={
        mode === "add"
          ? msg("MSG-C07", { category: getCategoryName(categoryId) })
          : msg("MSG-C09")
      }
      buttons={[
        { label: "キャンセル", onClick: onClose },
        {
          label: mode === "add" ? "追加" : "変更",
          style: "bold",
          disabled: !canSubmit,
          onClick: submit,
        },
      ]}
    >
      <input
        className={styles.nameInput}
        type="text"
        aria-label="サブカテゴリ名"
        value={name}
        maxLength={MAX_LENGTH.subcategoryName}
        placeholder={mode === "add" ? "例: ジョガーパンツ" : undefined}
        enterKeyHint="done"
        // 表示と同時に入力状態にし、キーボードを開く
        autoFocus
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      {error && <p className={styles.nameError}>{msg(error)}</p>}
    </Dialog>
  );
}
