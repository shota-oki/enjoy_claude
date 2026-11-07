import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import form from "../../components/Form.module.css";
import { Icon } from "../../components/Icon";
import { NavBar, NavButton } from "../../components/NavBar";
import { CATEGORIES } from "../../constants/categories";
import { useGoBack } from "../../hooks/useGoBack";
import { useSubcategories } from "../../hooks/useSubcategories";
import styles from "../SettingsScreen/SettingsScreen.module.css";

// SC-07 サブカテゴリ管理（カテゴリ選択）
export function CategorySelectScreen() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const all = useSubcategories();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of all ?? [])
      map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1);
    return map;
  }, [all]);

  return (
    <div className="screen">
      <NavBar
        title="サブカテゴリ管理"
        left={
          <NavButton label="設定" back onClick={() => goBack("/settings")} />
        }
      />
      <div className="screen-content">
        <h2 className={form.sectionTitle}>編集するカテゴリを選択</h2>
        <div className={form.group}>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${form.row} ${styles.link}`}
              onClick={() => navigate(`/settings/subcategories/${category.id}`)}
            >
              <span className={styles.categoryIcon} aria-hidden="true">
                {category.icon}
              </span>
              <span className={styles.linkLabel}>{category.name}</span>
              {all && (
                <span className={form.value}>
                  {counts.get(category.id) ?? 0}件
                </span>
              )}
              <span className={form.chev}>
                <Icon name="chev" size={16} strokeWidth={2.4} />
              </span>
            </button>
          ))}
        </div>
        <p className={styles.notice}>
          カテゴリ自体は固定のため変更できません。
        </p>
      </div>
    </div>
  );
}
