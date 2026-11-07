import { UPDATE_CHECK_INTERVAL_MS } from "../constants/limits";
import { logger } from "../utils/logger";

/** vite-plugin-pwa の registerSW と同じ形の関数（テストで差し替えられるよう引数で受け取る） */
export type RegisterSW = (options: {
  onNeedRefresh?: () => void;
  onRegisteredSW?: (
    swUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void;
  onRegisterError?: (error: unknown) => void;
}) => (reloadPage?: boolean) => Promise<void>;

type Listener = () => void;

let available = false;
let registration: ServiceWorkerRegistration | undefined;
let lastCheckedAt = 0;
let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined;
const listeners = new Set<Listener>();

function setAvailable(value: boolean) {
  if (available === value) return;
  available = value;
  for (const listener of listeners) listener();
}

/** 新しい版を確認する（M-01 4.2）。通信できない場合は確認しない */
async function check(now: number) {
  if (!registration || !navigator.onLine) return;
  lastCheckedAt = now;
  try {
    await registration.update();
  } catch (error) {
    logger.warn("新しい版の確認に失敗しました", error);
  }
  // ×で閉じたあとも、確認のたびに待機中の新しい版があれば再表示する
  if (registration.waiting) setAvailable(true);
}

function onVisibilityChange() {
  if (document.visibilityState !== "visible") return;
  const now = Date.now();
  // 前回の確認から1時間以上経っている場合のみ確認する
  if (now - lastCheckedAt >= UPDATE_CHECK_INTERVAL_MS) void check(now);
}

/** 新しい版への切り替え（M-01 4章）。状態は useSyncExternalStore で参照する */
export const updateService = {
  /** Service Worker を登録する。登録時に起動時の確認が行われる */
  start(registerSW: RegisterSW) {
    lastCheckedAt = Date.now();
    applyUpdate = registerSW({
      onNeedRefresh: () => setAvailable(true),
      onRegisteredSW: (_url, reg) => {
        registration = reg;
      },
      onRegisterError: (error) =>
        logger.warn("Service Worker の登録に失敗しました", error),
    });
    document.addEventListener("visibilitychange", onVisibilityChange);
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  isAvailable: () => available,

  /** ×で閉じる。次の確認タイミングで再表示する */
  dismiss() {
    setAvailable(false);
  },

  /** 新しい版に切り替えて再読み込みする */
  async apply() {
    if (!applyUpdate) return;
    await applyUpdate(true);
  },

  /** テスト用：状態を初期化する */
  reset() {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    available = false;
    registration = undefined;
    lastCheckedAt = 0;
    applyUpdate = undefined;
    listeners.clear();
  },
};
