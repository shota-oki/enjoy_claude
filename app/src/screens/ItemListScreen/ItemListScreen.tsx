import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import choice from "../../components/Choice.module.css";
import { Icon } from "../../components/Icon";
import { NavBar } from "../../components/NavBar";
import { Swatch } from "../../components/Swatch";
import { CATEGORIES, getCategoryName } from "../../constants/categories";
import { getColor } from "../../constants/colors";
import { getSeasonName } from "../../constants/seasons";
import type { SortOrderId } from "../../constants/sortOrders";
import { useItems } from "../../hooks/useItems";
import { useSubcategories } from "../../hooks/useSubcategories";
import { useThumbnails } from "../../hooks/useThumbnails";
import {
  countByCategory,
  countBySubcategory,
  filter as filterItems,
  listBrands,
  sort,
} from "../../services/listQuery";
import { useListState } from "../../state/ListStateContext";
import {
  EMPTY_FILTER,
  UNSET_SUBCATEGORY,
  type ListFilter,
} from "../../types/models";
import { FilterSheet } from "./FilterSheet";
import { ItemCard } from "./ItemCard";
import styles from "./ItemListScreen.module.css";
import { SortSheet } from "./SortSheet";

/** SC-05（新規）へ引き渡す初期値 */
export interface NewItemDefaults {
  categoryId: ListFilter["categoryId"];
  subcategoryId: string | null;
}

// SC-01 アイテム一覧
export function ItemListScreen() {
  const navigate = useNavigate();
  const {
    filter,
    setFilter,
    sortOrder,
    changeSortOrder,
    saveScroll,
    takeScroll,
    showInstallBanner,
    closeInstallBanner,
  } = useListState();
  const items = useItems();
  const allSubcategories = useSubcategories();
  const categorySubcategories = useSubcategories(filter.categoryId);
  const [sheet, setSheet] = useState<"filter" | "sort" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const brands = useMemo(() => (items ? listBrands(items) : []), [items]);
  const shown = useMemo(
    () => (items ? sort(filterItems(items, filter), sortOrder) : []),
    [items, filter, sortOrder],
  );
  const thumbnails = useThumbnails(
    useMemo(() => shown.map((item) => item.photoIds[0]), [shown]),
  );

  // 該当するアイテムがなくなったブランドを条件から取り除く（SC-02 4章）
  useEffect(() => {
    if (!items) return;
    const existing = new Set(brands);
    if (filter.brands.some((b) => !existing.has(b))) {
      setFilter((f) => ({
        ...f,
        brands: f.brands.filter((b) => existing.has(b)),
      }));
    }
  }, [items, brands, filter.brands, setFilter]);

  // SC-04 から戻った場合はスクロール位置を戻す（SC-01 7章）
  // （一覧が表示されてから1回だけ行う）
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (!items || restored.current) return;
    restored.current = true;
    const top = takeScroll();
    if (top !== null && contentRef.current) contentRef.current.scrollTop = top;
  }, [items, takeScroll]);

  // 条件・並び順を変更した場合は先頭に戻す
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [filter, sortOrder]);

  const subcategoryNames = useMemo(
    () => new Map((allSubcategories ?? []).map((s) => [s.id, s.name])),
    [allSubcategories],
  );

  const total = items?.length ?? 0;
  const extraCount =
    filter.colorIds.length + filter.seasons.length + filter.brands.length;
  const filtered =
    filter.categoryId !== null ||
    filter.subcategoryId !== null ||
    extraCount > 0;

  const selectSort = (order: SortOrderId) => {
    setSheet(null);
    if (order !== sortOrder) changeSortOrder(order);
  };

  const openItem = (id: string) => {
    saveScroll(contentRef.current?.scrollTop ?? 0);
    navigate(`/items/${id}`);
  };

  const openNew = () => {
    const defaults: NewItemDefaults = {
      categoryId: filter.categoryId,
      subcategoryId:
        filter.subcategoryId === UNSET_SUBCATEGORY
          ? null
          : filter.subcategoryId,
    };
    navigate("/items/new", { state: defaults });
  };

  return (
    <div className="screen">
      <NavBar
        right={
          <>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="並び替え"
              onClick={() => setSheet("sort")}
            >
              <Icon name="sort" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="絞り込み"
              onClick={() => setSheet("filter")}
            >
              <Icon name="filter" />
              {extraCount > 0 && (
                <span className={styles.badge}>{extraCount}</span>
              )}
            </button>
          </>
        }
      />
      <div className="screen-content" ref={contentRef}>
        <div className={styles.largeTitle}>
          <h1>クローゼット</h1>
          {items && (
            <span className={styles.count}>
              {filtered ? `${shown.length} / ${total}点` : `${total}点`}
            </span>
          )}
        </div>

        {showInstallBanner && (
          <div className={styles.banner} role="note">
            <div>
              <b>ホーム画面に追加してご利用ください</b>
              Safariの共有ボタン
              →「ホーム画面に追加」。追加せずに使うと、しばらく開かない間にデータが消える場合があります。
            </div>
            <button
              type="button"
              aria-label="案内を閉じる"
              onClick={closeInstallBanner}
            >
              <Icon name="x" size={14} strokeWidth={2.6} />
            </button>
          </div>
        )}

        {items && total > 0 && (
          <>
            <CategoryChips
              counts={countByCategory(items, filter)}
              selected={filter.categoryId}
              onSelect={(categoryId) =>
                categoryId !== filter.categoryId &&
                setFilter((f) => ({ ...f, categoryId, subcategoryId: null }))
              }
            />
            {filter.categoryId !== null &&
              (() => {
                const subs = categorySubcategories ?? [];
                const hasUnset = items.some(
                  (i) =>
                    i.categoryId === filter.categoryId &&
                    i.subcategoryId === null,
                );
                if (subs.length === 0 && !hasUnset) return null;
                const counts = countBySubcategory(items, filter);
                const options = [
                  ...subs.map((s) => ({ id: s.id, name: s.name })),
                  ...(hasUnset
                    ? [{ id: UNSET_SUBCATEGORY, name: "未設定" }]
                    : []),
                ];
                return (
                  <div className={styles.chips}>
                    <button
                      type="button"
                      className={`${choice.chip} ${choice.small}`}
                      aria-pressed={filter.subcategoryId === null}
                      onClick={() =>
                        setFilter((f) => ({ ...f, subcategoryId: null }))
                      }
                    >
                      すべて
                    </button>
                    {options.map((o) => {
                      const n = counts.get(o.id) ?? 0;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          className={`${choice.chip} ${choice.small} ${n === 0 ? choice.zero : ""}`}
                          aria-pressed={filter.subcategoryId === o.id}
                          onClick={() =>
                            setFilter((f) => ({ ...f, subcategoryId: o.id }))
                          }
                        >
                          {o.name}
                          <span className={choice.chipCount}>{n}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            {extraCount > 0 && (
              <FilterTags
                filter={filter}
                onRemove={(update) => setFilter(update)}
                onClear={() =>
                  setFilter((f) => ({
                    ...f,
                    colorIds: [],
                    seasons: [],
                    brands: [],
                  }))
                }
              />
            )}
          </>
        )}

        {items && total === 0 && (
          <div className={styles.empty}>
            まだアイテムが登録されていません。
            <br />
            右下の＋から、手持ちの服を登録しましょう。
          </div>
        )}
        {items && total > 0 && shown.length === 0 && (
          <div className={styles.empty}>
            条件に一致するアイテムがありません。
            <br />
            <button
              type="button"
              className={`${choice.chip} ${styles.emptyButton}`}
              aria-pressed="true"
              onClick={() => setFilter(() => EMPTY_FILTER)}
            >
              条件をすべてクリア
            </button>
          </div>
        )}
        {shown.length > 0 && (
          <div className={styles.grid}>
            {shown.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                thumbnail={thumbnails?.get(item.photoIds[0])}
                classification={
                  (item.subcategoryId &&
                    subcategoryNames.get(item.subcategoryId)) ||
                  getCategoryName(item.categoryId)
                }
                onOpen={() => openItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.fab}
        aria-label="アイテム登録"
        onClick={openNew}
      >
        <Icon name="plus" size={28} strokeWidth={2.4} />
      </button>

      {sheet === "sort" && (
        <SortSheet
          current={sortOrder}
          onSelect={selectSort}
          onCancel={() => setSheet(null)}
        />
      )}
      {sheet === "filter" && items && (
        <FilterSheet
          items={items}
          brands={brands}
          applied={filter}
          onApply={(next) => {
            setSheet(null);
            setFilter(() => next);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function CategoryChips({
  counts,
  selected,
  onSelect,
}: {
  counts: Map<string, number>;
  selected: ListFilter["categoryId"];
  onSelect: (id: ListFilter["categoryId"]) => void;
}) {
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const options = [
    { id: null, name: "すべて", n: total },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      n: counts.get(c.id) ?? 0,
    })),
  ];
  return (
    <div className={styles.chips}>
      {options.map((o) => (
        <button
          key={o.id ?? "all"}
          type="button"
          className={`${choice.chip} ${o.n === 0 ? choice.zero : ""}`}
          aria-pressed={selected === o.id}
          onClick={() => onSelect(o.id)}
        >
          {o.name}
          <span className={choice.chipCount}>{o.n}</span>
        </button>
      ))}
    </div>
  );
}

function FilterTags({
  filter,
  onRemove,
  onClear,
}: {
  filter: ListFilter;
  onRemove: (update: (f: ListFilter) => ListFilter) => void;
  onClear: () => void;
}) {
  const tags = [
    ...filter.colorIds.map((id) => ({
      key: `c-${id}`,
      label: (
        <>
          <Swatch colorId={id} />
          {getColor(id)?.name}
        </>
      ),
      remove: (f: ListFilter) => ({
        ...f,
        colorIds: f.colorIds.filter((v) => v !== id),
      }),
    })),
    ...filter.seasons.map((id) => ({
      key: `s-${id}`,
      label: <>{getSeasonName(id)}</>,
      remove: (f: ListFilter) => ({
        ...f,
        seasons: f.seasons.filter((v) => v !== id),
      }),
    })),
    ...filter.brands.map((brand) => ({
      key: `b-${brand}`,
      label: <>{brand}</>,
      remove: (f: ListFilter) => ({
        ...f,
        brands: f.brands.filter((v) => v !== brand),
      }),
    })),
  ];
  return (
    <div className={styles.activeFilters}>
      {tags.map((tag) => (
        <span key={tag.key} className={styles.tag}>
          {tag.label}
          <button
            type="button"
            aria-label="条件を解除"
            onClick={() => onRemove(tag.remove)}
          >
            <Icon name="x" size={14} strokeWidth={2.6} />
          </button>
        </span>
      ))}
      <button type="button" className={styles.clear} onClick={onClear}>
        クリア
      </button>
    </div>
  );
}
