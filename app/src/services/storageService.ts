// 永続保存の要求・状態取得、起動方法の判定（P-01、P-10）

/** 永続保存を要求する。未対応・拒否の場合は false */
export async function requestPersist(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

/** 永続保存の状態。取得する機能に未対応の場合は false（「未許可」と表示する） */
export async function isPersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) return false;
  return navigator.storage.persisted();
}

/** ホーム画面から起動しているか */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  if (iosStandalone === true) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}
