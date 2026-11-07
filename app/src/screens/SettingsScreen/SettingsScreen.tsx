import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import form from "../../components/Form.module.css";
import { Icon } from "../../components/Icon";
import { NavBar } from "../../components/NavBar";
import { itemRepository } from "../../repositories/itemRepository";
import { photoRepository } from "../../repositories/photoRepository";
import { isPersisted } from "../../services/storageService";
import { formatByteSize, formatCount } from "../../utils/format";
import { logger } from "../../utils/logger";
import styles from "./SettingsScreen.module.css";

// 取得に失敗した項目
const FAILED = "failed";

/** 取得に失敗したら FAILED を返す（その項目だけ「―」と表示する。P-10 4章） */
async function orFailed<T>(
  label: string,
  load: () => Promise<T>,
): Promise<T | typeof FAILED> {
  try {
    return await load();
  } catch (error) {
    logger.warn(`${label}の取得に失敗しました`, error);
    return FAILED;
  }
}

// SC-06 設定
export function SettingsScreen() {
  const navigate = useNavigate();
  const count = useLiveQuery(
    () => orFailed("登録アイテム数", () => itemRepository.count()),
    [],
  );
  const byteSize = useLiveQuery(
    () => orFailed("保存容量", () => photoRepository.totalByteSize()),
    [],
  );
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    // 取得する機能に未対応・失敗した場合は「未許可」と表示する
    isPersisted()
      .catch((error: unknown) => {
        logger.warn("永続保存の状態の取得に失敗しました", error);
        return false;
      })
      .then((value) => {
        if (active) setPersisted(value);
      });
    return () => {
      active = false;
    };
  }, []);

  const show = <T,>(
    value: T | typeof FAILED | undefined,
    f: (v: T) => string,
  ) => (value === undefined ? "" : value === FAILED ? "―" : f(value));

  return (
    <div className="screen">
      <NavBar />
      <div className="screen-content">
        <h1 className={styles.largeTitle}>設定</h1>

        <h2 className={form.sectionTitle}>分類</h2>
        <div className={form.group}>
          <button
            type="button"
            className={`${form.row} ${styles.link}`}
            onClick={() => navigate("/settings/subcategories")}
          >
            <span className={styles.linkLabel}>サブカテゴリ管理</span>
            <span className={form.chev}>
              <Icon name="chev" size={16} strokeWidth={2.4} />
            </span>
          </button>
        </div>

        <h2 className={form.sectionTitle}>アプリについて</h2>
        <div className={form.group}>
          <InfoRow label="登録アイテム数" value={show(count, formatCount)} />
          <InfoRow
            label="写真の保存容量"
            value={show(byteSize, formatByteSize)}
          />
          <div className={styles.infoRowWrap}>
            <InfoRow
              label="データの永続保存"
              value={persisted === null ? "" : persisted ? "有効" : "未許可"}
            />
            {persisted === false && (
              <p className={styles.persistNote}>
                ホーム画面に追加して開くと有効になります。
              </p>
            )}
          </div>
          <InfoRow label="バージョン" value={__APP_VERSION__} />
        </div>

        <p className={styles.note}>
          データはこのiPhone内にのみ保存されます。Safariの履歴・Webサイトデータを削除すると、登録したデータも削除されます。
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={form.row}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={form.value}>{value}</span>
    </div>
  );
}
