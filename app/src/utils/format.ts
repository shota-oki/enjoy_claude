// 表示形式（画面詳細設計書 共通仕様 3章、SC-06 3章）

/** "YYYY-MM-DD" を "YYYY/MM/DD" に変換する */
export function formatDateString(value: string): string {
  return value.replaceAll("-", "/");
}

/** エポックミリ秒を "YYYY/MM/DD"（端末の日付）に変換する */
export function formatTimestamp(epochMs: number): string {
  return formatDateString(toDateString(new Date(epochMs)));
}

/** Date を "YYYY-MM-DD"（端末の日付）に変換する */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 金額を「¥12,100」の形式にする */
export function formatPrice(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

/** 件数を「16点」の形式にする */
export function formatCount(value: number): string {
  return `${value}点`;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** 容量を「1MB未満」「約32.4MB」「約1.2GB」の形式にする */
export function formatByteSize(bytes: number): string {
  if (bytes < MB) return "1MB未満";
  if (bytes < GB) return `約${(bytes / MB).toFixed(1)}MB`;
  return `約${(bytes / GB).toFixed(1)}GB`;
}
