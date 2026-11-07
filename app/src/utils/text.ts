/**
 * 前後の空白を取り除く。
 * String.prototype.trim は全角空白（U+3000）も空白として取り除く
 */
export function trimText(value: string): string {
  return value.trim();
}

/** 前後の空白を取り除き、空になった場合は null を返す（DB設計書 共通 2章：未入力は null） */
export function toNullableText(value: string): string | null {
  const trimmed = trimText(value);
  return trimmed === "" ? null : trimmed;
}

/** 全角数字を半角数字に変換する */
export function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
}
