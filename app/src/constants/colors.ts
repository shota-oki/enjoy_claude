// ベースカラー定義（DB設計書 共通 5.2）
export const COLORS = [
  { id: "white", name: "白", swatch: "#F7F7F5" },
  { id: "black", name: "黒", swatch: "#262628" },
  { id: "gray", name: "グレー", swatch: "#9C9CA1" },
  { id: "navy", name: "ネイビー", swatch: "#1F2F54" },
  { id: "beige", name: "ベージュ", swatch: "#D9C6A5" },
  { id: "brown", name: "ブラウン", swatch: "#7A5232" },
  { id: "khaki", name: "カーキ", swatch: "#6B6A3C" },
  { id: "red", name: "赤", swatch: "#C0392B" },
  { id: "blue", name: "青", swatch: "#3A74C9" },
  { id: "green", name: "緑", swatch: "#2E7D4F" },
  { id: "yellow", name: "黄", swatch: "#E8C547" },
  { id: "pink", name: "ピンク", swatch: "#E8A0B4" },
  { id: "purple", name: "紫", swatch: "#7E57C2" },
  // 「その他」は多色のグラデーションで表示する
  {
    id: "other",
    name: "その他",
    swatch:
      "conic-gradient(#C0392B, #E8C547, #2E7D4F, #3A74C9, #7E57C2, #C0392B)",
  },
] as const;

export type ColorId = (typeof COLORS)[number]["id"];
export type ColorDef = (typeof COLORS)[number];

const COLOR_MAP = new Map<string, ColorDef>(COLORS.map((c) => [c.id, c]));

export function getColor(id: string): ColorDef | undefined {
  return COLOR_MAP.get(id);
}
