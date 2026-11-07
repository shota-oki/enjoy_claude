import { useRef, type ReactNode, type TouchEvent } from "react";
import styles from "./Overlay.module.css";

// 下から重ねて表示するシート（SC-02）。外側のタップ・下へのスワイプで閉じる
interface Props {
  title: string;
  headLeft?: ReactNode;
  headRight?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

// この距離以上、下にスワイプしたら閉じる
const SWIPE_CLOSE_PX = 80;

export function BottomSheet({
  title,
  headLeft,
  headRight,
  footer,
  onClose,
  children,
}: Props) {
  const startY = useRef<number | null>(null);

  // つまみ・ヘッダー部分のスワイプで閉じる（本文はスクロールに使うため対象外）
  const onTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (startY.current === null) return;
    const moved = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (moved > SWIPE_CLOSE_PX) onClose();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className={styles.grip} />
          <div className={styles.sheetHead}>
            {headLeft ?? <span />}
            <h2 className={styles.sheetTitle}>{title}</h2>
            {headRight ?? <span />}
          </div>
        </div>
        <div className={styles.sheetBody}>{children}</div>
        {footer && <div className={styles.sheetFoot}>{footer}</div>}
      </section>
    </>
  );
}
