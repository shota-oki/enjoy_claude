import { getColor } from "../constants/colors";

// 色見本（ベースカラー）。「その他」はグラデーションで表示する
interface Props {
  colorId: string;
  size?: number;
}

export function Swatch({ colorId, size = 14 }: Props) {
  const color = getColor(colorId);
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color?.swatch ?? "#d1d1d6",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)",
      }}
    />
  );
}
