import type { ReactNode } from "react";
import type { DialogButton } from "../state/UiContext";
import styles from "./Overlay.module.css";

// 画面中央の確認ダイアログ（共通仕様 4章）。誤操作を防ぐため外側をタップしても閉じない
interface Props {
  title: string;
  message?: string;
  buttons: (DialogButton & { disabled?: boolean })[];
  children?: ReactNode;
}

const BUTTON_CLASS: Record<NonNullable<DialogButton["style"]>, string> = {
  normal: "",
  bold: styles.bold,
  destructive: styles.destructive,
  destructiveBold: `${styles.destructive} ${styles.bold}`,
};

export function Dialog({ title, message, buttons, children }: Props) {
  return (
    <>
      <div className={styles.dialogBackdrop} aria-hidden="true" />
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.dialogBody}>
          <h2 className={styles.dialogTitle}>{title}</h2>
          {message && <p className={styles.dialogMessage}>{message}</p>}
          {children}
        </div>
        <div className={styles.dialogButtons}>
          {buttons.map((button) => (
            <button
              key={button.label}
              type="button"
              className={`${styles.dialogButton} ${BUTTON_CLASS[button.style ?? "normal"]}`}
              onClick={button.onClick}
              disabled={button.disabled}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
