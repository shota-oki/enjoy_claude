import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import styles from "./TabBar.module.css";

// タブバー（共通仕様 4章）。タップするとそのタブの先頭画面へ移動する
export function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inSettings = pathname.startsWith("/settings");

  return (
    <nav className={styles.tabbar}>
      <button
        type="button"
        className={`${styles.tab} ${inSettings ? "" : styles.active}`}
        onClick={() => navigate("/")}
        aria-current={inSettings ? undefined : "page"}
      >
        <Icon name="hanger" size={26} />
        クローゼット
      </button>
      <button
        type="button"
        className={`${styles.tab} ${inSettings ? styles.active : ""}`}
        onClick={() => navigate("/settings")}
        aria-current={inSettings ? "page" : undefined}
      >
        <Icon name="gear" size={26} />
        設定
      </button>
    </nav>
  );
}
