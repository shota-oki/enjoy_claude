import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { msg } from "../constants/messages";
import { updateService } from "../services/updateService";
import { logger } from "../utils/logger";
import { Icon } from "./Icon";
import styles from "./UpdateBanner.module.css";

// 更新の案内（共通仕様 4章、M-01 4.3）。タブバーの上に表示する
export function UpdateBanner() {
  const navigate = useNavigate();
  const available = useSyncExternalStore(
    updateService.subscribe,
    updateService.isAvailable,
  );
  const [applying, setApplying] = useState(false);

  if (!available) return null;

  const apply = async () => {
    setApplying(true);
    // 再読み込み後に SC-01 を表示する
    navigate("/", { replace: true });
    try {
      await updateService.apply();
    } catch (error) {
      logger.error("新しい版への切り替えに失敗しました", error);
      setApplying(false);
    }
  };

  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>{msg("MSG-I06")}</span>
      <button
        type="button"
        className={styles.update}
        disabled={applying}
        onClick={apply}
      >
        更新
      </button>
      <button
        type="button"
        className={styles.close}
        aria-label="更新の案内を閉じる"
        disabled={applying}
        onClick={() => updateService.dismiss()}
      >
        <Icon name="x" size={14} strokeWidth={2.6} />
      </button>
    </div>
  );
}
