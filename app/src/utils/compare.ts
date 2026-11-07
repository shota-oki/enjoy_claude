// 名前順の比較（SC-01 5章：五十音順、英字で始まるものは日本語の後）

const collator = new Intl.Collator("ja", {
  numeric: true,
  sensitivity: "base",
});

// 英字（半角・全角）で始まるかどうか
const LATIN_START = /^[A-Za-zＡ-Ｚａ-ｚ]/;

function group(value: string): number {
  return LATIN_START.test(value) ? 1 : 0;
}

export function compareName(a: string, b: string): number {
  const diff = group(a) - group(b);
  if (diff !== 0) return diff;
  return collator.compare(a, b);
}
