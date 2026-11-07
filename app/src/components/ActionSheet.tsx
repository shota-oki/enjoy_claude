import { Icon } from "./Icon";
import styles from "./Overlay.module.css";

// 画面下部から表示するアクションシート（SC-03、DL-01、DL-02）。外側のタップで閉じる
export interface ActionOption {
  label: string;
  onSelect: () => void;
  checked?: boolean;
  destructive?: boolean;
}

interface Props {
  title: string;
  options: ActionOption[];
  onCancel: () => void;
}

export function ActionSheet({ title, options, onCancel }: Props) {
  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} aria-hidden="true" />
      <div
        className={styles.actions}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.actionBox}>
          <h2 className={styles.actionHead}>{title}</h2>
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`${styles.actionButton} ${option.destructive ? styles.destructive : ""}`}
              onClick={option.onSelect}
              aria-pressed={option.checked}
            >
              {option.label}
              {option.checked && (
                <span className={styles.check}>
                  <Icon name="check" size={20} strokeWidth={2.6} />
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.actionCancel}
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </>
  );
}
