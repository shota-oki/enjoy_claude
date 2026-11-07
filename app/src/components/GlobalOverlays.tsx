import { useUi } from "../state/UiContext";
import { Dialog } from "./Dialog";
import styles from "./Overlay.module.css";

/** UiContext のトースト・ダイアログを表示する */
export function GlobalOverlays() {
  const { toast, dialog } = useUi();
  return (
    <>
      {dialog && (
        <Dialog
          title={dialog.title}
          message={dialog.message}
          buttons={dialog.buttons}
        />
      )}
      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </>
  );
}
