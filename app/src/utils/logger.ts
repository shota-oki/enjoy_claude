// ログ出力（処理設計書 共通 10章）
// 開発者コンソールにのみ出力し、本番では ERROR・WARN のみ。入力内容・画像は渡さないこと
const isDev = import.meta.env.DEV;

export const logger = {
  error: (message: string, error?: unknown) => console.error(message, error),
  warn: (message: string, error?: unknown) => console.warn(message, error),
  info: (message: string) => {
    if (isDev) console.info(message);
  },
  debug: (message: string, detail?: unknown) => {
    if (isDev) console.debug(message, detail);
  },
};
