import type { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./NavBar.module.css";

// ナビゲーションバー（共通仕様 4章）。左に戻る／キャンセル、中央にタイトル、右に画面固有の操作
interface Props {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export function NavBar({ title, left, right }: Props) {
  return (
    <header className={styles.navbar}>
      <div className={styles.side}>{left}</div>
      {title && <h1 className={styles.title}>{title}</h1>}
      <div className={styles.side}>{right}</div>
    </header>
  );
}

interface ButtonProps {
  label: string;
  onClick: () => void;
  back?: boolean;
  bold?: boolean;
  disabled?: boolean;
}

export function NavButton({
  label,
  onClick,
  back,
  bold,
  disabled,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${bold ? styles.bold : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {back && <Icon name="back" strokeWidth={2.6} />}
      {label}
    </button>
  );
}
