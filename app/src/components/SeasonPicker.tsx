import { SEASONS, type SeasonId } from "../constants/seasons";
import styles from "./Choice.module.css";

// 季節の4択ボタン（複数選択）。再タップで解除する
interface Props {
  selected: readonly SeasonId[];
  onToggle: (id: SeasonId) => void;
}

export function SeasonPicker({ selected, onToggle }: Props) {
  return (
    <div className={styles.seg}>
      {SEASONS.map((season) => (
        <button
          key={season.id}
          type="button"
          aria-pressed={selected.includes(season.id)}
          onClick={() => onToggle(season.id)}
        >
          {season.name}
        </button>
      ))}
    </div>
  );
}

/** 配列に含まれていれば取り除き、含まれていなければ加える */
export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
