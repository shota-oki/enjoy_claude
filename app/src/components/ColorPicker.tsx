import { COLORS, type ColorId } from "../constants/colors";
import styles from "./Choice.module.css";
import { Swatch } from "./Swatch";

// ベースカラーの色見本14色（5列）。選択中は枠で強調する
interface Props {
  isSelected: (id: ColorId) => boolean;
  onToggle: (id: ColorId) => void;
}

export function ColorPicker({ isSelected, onToggle }: Props) {
  return (
    <div className={styles.colorGrid}>
      {COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={styles.colorOption}
          aria-pressed={isSelected(color.id)}
          onClick={() => onToggle(color.id)}
        >
          <Swatch colorId={color.id} size={32} />
          {color.name}
        </button>
      ))}
    </div>
  );
}
