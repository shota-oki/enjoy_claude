import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TOAST_DURATION_MS } from "../constants/limits";
import { msg, type MessageId } from "../constants/messages";

// トースト・ダイアログの表示管理（処理設計書 共通 7章）

export interface DialogButton {
  label: string;
  /** bold: 太字、destructive: 赤字、destructiveBold: 赤字・太字 */
  style?: "normal" | "bold" | "destructive" | "destructiveBold";
  onClick: () => void;
}

export interface DialogState {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

interface UiContextValue {
  toast: string | null;
  dialog: DialogState | null;
  showToast: (message: string) => void;
  showDialog: (dialog: DialogState) => void;
  closeDialog: () => void;
  /** MSG-E11・E12 などのエラーをOKボタンだけのダイアログで表示する */
  showError: (id: MessageId) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = useCallback((message: string) => {
    // 表示中に次のトーストが発生した場合は置き換える
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const showError = useCallback(
    (id: MessageId) =>
      setDialog({
        title: msg(id),
        buttons: [
          { label: "OK", style: "bold", onClick: () => setDialog(null) },
        ],
      }),
    [],
  );

  const value = useMemo(
    () => ({
      toast,
      dialog,
      showToast,
      showDialog: setDialog,
      closeDialog,
      showError,
    }),
    [toast, dialog, showToast, closeDialog, showError],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const value = useContext(UiContext);
  if (!value) throw new Error("UiProvider の外では使えません");
  return value;
}
