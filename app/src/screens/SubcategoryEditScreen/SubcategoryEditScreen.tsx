import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Dialog } from "../../components/Dialog";
import form from "../../components/Form.module.css";
import { Icon } from "../../components/Icon";
import { NavBar, NavButton } from "../../components/NavBar";
import {
  getCategoryName,
  isCategoryId,
  type CategoryId,
} from "../../constants/categories";
import { MAX_SUBCATEGORIES_PER_CATEGORY } from "../../constants/limits";
import { msg } from "../../constants/messages";
import { useGoBack } from "../../hooks/useGoBack";
import { useSubcategories } from "../../hooks/useSubcategories";
import { InUseError } from "../../repositories/errors";
import { itemRepository } from "../../repositories/itemRepository";
import { subcategoryRepository } from "../../repositories/subcategoryRepository";
import { useListState } from "../../state/ListStateContext";
import { useUi } from "../../state/UiContext";
import type { Subcategory } from "../../types/models";
import { logger } from "../../utils/logger";
import { NameDialog } from "./NameDialog";
import styles from "./SubcategoryEditScreen.module.css";

// SC-08 サブカテゴリ編集（DL-05・DL-06 を含む）
export function SubcategoryEditScreen() {
  const { categoryId = "" } = useParams();
  // 存在しないカテゴリのURLは SC-01 へ（処理設計書 共通 6章）
  if (!isCategoryId(categoryId)) return <Navigate to="/" replace />;
  return <SubcategoryEdit categoryId={categoryId} />;
}

type DeleteDialog =
  | { kind: "confirm"; subcategory: Subcategory }
  | { kind: "inUse"; subcategory: Subcategory; count: number };

type NameDialogState =
  { kind: "add" } | { kind: "rename"; subcategory: Subcategory };

function SubcategoryEdit({ categoryId }: { categoryId: CategoryId }) {
  const goBack = useGoBack();
  const { showToast, showError } = useUi();
  const { filter, setFilter } = useListState();
  const subcategories = useSubcategories(categoryId);
  const counts = useLiveQuery(
    () => itemRepository.countBySubcategory(categoryId),
    [categoryId],
  );
  const [reordering, setReordering] = useState(false);
  const [moving, setMoving] = useState(false);
  const [nameDialog, setNameDialog] = useState<NameDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog | null>(null);
  const [deleting, setDeleting] = useState(false);

  const list = subcategories ?? [];
  const categoryName = getCategoryName(categoryId);

  const openAdd = () => {
    if (list.length >= MAX_SUBCATEGORIES_PER_CATEGORY) {
      showToast(msg("MSG-E15"));
      return;
    }
    setNameDialog({ kind: "add" });
  };

  /** 隣のサブカテゴリと表示順を入れ替える（P-08）。処理中は上下ボタンを押せない */
  const move = async (index: number, offset: -1 | 1) => {
    const target = list[index];
    const other = list[index + offset];
    if (!target || !other || moving) return;
    setMoving(true);
    try {
      await subcategoryRepository.swapOrder(target.id, other.id);
    } catch (error) {
      logger.error("サブカテゴリの並び替えに失敗しました", error);
      showError("MSG-E11");
    } finally {
      setMoving(false);
    }
  };

  /** 削除ボタンを押した時点の件数で DL-06 の内容を決める（P-09 3章 手順2） */
  const openDelete = (subcategory: Subcategory) => {
    const count = counts?.get(subcategory.id) ?? 0;
    setDeleteDialog(
      count > 0
        ? { kind: "inUse", subcategory, count }
        : { kind: "confirm", subcategory },
    );
  };

  const remove = async (subcategory: Subcategory) => {
    setDeleting(true);
    try {
      await subcategoryRepository.remove(subcategory.id);
      setDeleteDialog(null);
      showToast(msg("MSG-I03"));
      // 一覧でこのサブカテゴリを選択中なら「すべて」に戻す
      if (filter.subcategoryId === subcategory.id) {
        setFilter((f) => ({ ...f, subcategoryId: null }));
      }
    } catch (error) {
      if (error instanceof InUseError) {
        // 確認ダイアログの表示中にアイテムが登録された場合
        setDeleteDialog({ kind: "inUse", subcategory, count: error.count });
      } else {
        logger.error("サブカテゴリの削除に失敗しました", error);
        setDeleteDialog(null);
        showError("MSG-E11");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="screen">
      <NavBar
        title={categoryName}
        left={
          <NavButton
            label="戻る"
            back
            onClick={() => goBack("/settings/subcategories")}
          />
        }
        right={
          <NavButton
            label={reordering ? "完了" : "並び替え"}
            bold={reordering}
            disabled={!reordering && list.length <= 1}
            onClick={() => setReordering((r) => !r)}
          />
        }
      />
      <div className="screen-content">
        <h2 className={form.sectionTitle}>サブカテゴリ（{list.length}件）</h2>
        <div className={form.group}>
          {subcategories && list.length === 0 && (
            <p className={styles.emptyRow}>サブカテゴリはありません</p>
          )}
          {list.map((subcategory, index) => (
            <div key={subcategory.id} className={styles.subRow}>
              <span className={styles.name}>{subcategory.name}</span>
              <span className={styles.count}>
                {counts ? `${counts.get(subcategory.id) ?? 0}点` : ""}
              </span>
              {reordering ? (
                <>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`${subcategory.name}を上へ`}
                    disabled={index === 0 || moving}
                    onClick={() => move(index, -1)}
                  >
                    <Icon name="up" size={20} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`${subcategory.name}を下へ`}
                    disabled={index === list.length - 1 || moving}
                    onClick={() => move(index, 1)}
                  >
                    <Icon name="down" size={20} strokeWidth={2.4} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`${subcategory.name}の名称を変更`}
                    onClick={() =>
                      setNameDialog({ kind: "rename", subcategory })
                    }
                  >
                    <Icon name="pencil" size={20} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.danger}`}
                    aria-label={`${subcategory.name}を削除`}
                    onClick={() => openDelete(subcategory)}
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {!reordering && (
          <div className={`${form.group} ${styles.addGroup}`}>
            <button type="button" className={styles.addRow} onClick={openAdd}>
              <Icon name="plus" size={20} />
              サブカテゴリを追加
            </button>
          </div>
        )}
        <p className={styles.notice}>
          アイテムが登録されているサブカテゴリは削除できません。
        </p>
      </div>

      {nameDialog && (
        <NameDialog
          mode={nameDialog.kind}
          categoryId={categoryId}
          subcategory={
            nameDialog.kind === "rename" ? nameDialog.subcategory : undefined
          }
          existing={list}
          onClose={() => setNameDialog(null)}
        />
      )}

      {deleteDialog?.kind === "confirm" && (
        <Dialog
          title={msg("MSG-C10", { name: deleteDialog.subcategory.name })}
          buttons={[
            {
              label: "キャンセル",
              disabled: deleting,
              onClick: () => setDeleteDialog(null),
            },
            {
              label: "削除",
              style: "destructiveBold",
              disabled: deleting,
              onClick: () => remove(deleteDialog.subcategory),
            },
          ]}
        />
      )}
      {deleteDialog?.kind === "inUse" && (
        <Dialog
          title={msg("MSG-C11")}
          message={msg("MSG-C12", {
            name: deleteDialog.subcategory.name,
            n: deleteDialog.count,
          })}
          buttons={[
            {
              label: "OK",
              style: "bold",
              onClick: () => setDeleteDialog(null),
            },
          ]}
        />
      )}
    </div>
  );
}
