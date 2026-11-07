import { useState } from "react";
import { BottomSheet } from "../../components/BottomSheet";
import choice from "../../components/Choice.module.css";
import { ColorPicker } from "../../components/ColorPicker";
import overlay from "../../components/Overlay.module.css";
import { SeasonPicker, toggle } from "../../components/SeasonPicker";
import { COLORS } from "../../constants/colors";
import { SEASONS } from "../../constants/seasons";
import { filter as filterItems } from "../../services/listQuery";
import type { Item, ListFilter } from "../../types/models";
import styles from "./ItemListScreen.module.css";

// SC-02 絞り込み。シート内の選択は「○件を表示」を押すまで一覧に反映しない
interface Props {
  items: readonly Item[];
  brands: readonly string[];
  applied: ListFilter;
  onApply: (filter: ListFilter) => void;
  onClose: () => void;
}

type Draft = Pick<ListFilter, "colorIds" | "seasons" | "brands">;

const DEF_ORDER = {
  colors: new Map<string, number>(COLORS.map((c, i) => [c.id, i])),
  seasons: new Map<string, number>(SEASONS.map((s, i) => [s.id, i])),
};

export function FilterSheet({
  items,
  brands,
  applied,
  onApply,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<Draft>({
    colorIds: applied.colorIds,
    seasons: applied.seasons,
    brands: applied.brands,
  });

  // 一覧で選択中のカテゴリ・サブカテゴリも含めて数える（SC-02 3章 No.7）
  const count = filterItems(items, { ...applied, ...draft }).length;

  const apply = () => {
    // 条件タグを定義順（色・季節）、ブランドは一覧の名前順に並べて適用する
    onApply({
      ...applied,
      colorIds: [...draft.colorIds].sort(
        (a, b) => DEF_ORDER.colors.get(a)! - DEF_ORDER.colors.get(b)!,
      ),
      seasons: [...draft.seasons].sort(
        (a, b) => DEF_ORDER.seasons.get(a)! - DEF_ORDER.seasons.get(b)!,
      ),
      brands: brands.filter((b) => draft.brands.includes(b)),
    });
  };

  return (
    <BottomSheet
      title="絞り込み"
      onClose={onClose}
      headLeft={
        <button
          type="button"
          className={overlay.sheetHeadButton}
          onClick={() => setDraft({ colorIds: [], seasons: [], brands: [] })}
        >
          リセット
        </button>
      }
      headRight={
        <button
          type="button"
          className={overlay.sheetHeadButton}
          onClick={onClose}
        >
          閉じる
        </button>
      }
      footer={
        <button
          type="button"
          className={overlay.primaryButton}
          disabled={count === 0}
          onClick={apply}
        >
          {count === 0 ? "該当するアイテムがありません" : `${count}件を表示`}
        </button>
      }
    >
      <section className={styles.filterSection}>
        <h3>ベースカラー</h3>
        <ColorPicker
          isSelected={(id) => draft.colorIds.includes(id)}
          onToggle={(id) =>
            setDraft((d) => ({ ...d, colorIds: toggle(d.colorIds, id) }))
          }
        />
      </section>
      <section className={styles.filterSection}>
        <h3>季節</h3>
        <SeasonPicker
          selected={draft.seasons}
          onToggle={(id) =>
            setDraft((d) => ({ ...d, seasons: toggle(d.seasons, id) }))
          }
        />
      </section>
      <section className={styles.filterSection}>
        <h3>ブランド</h3>
        {brands.length === 0 ? (
          <p className={styles.filterNote}>登録されたブランドはありません</p>
        ) : (
          <div className={choice.wrap}>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                className={`${choice.chip} ${choice.small}`}
                aria-pressed={draft.brands.includes(brand)}
                onClick={() =>
                  setDraft((d) => ({ ...d, brands: toggle(d.brands, brand) }))
                }
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </section>
    </BottomSheet>
  );
}
