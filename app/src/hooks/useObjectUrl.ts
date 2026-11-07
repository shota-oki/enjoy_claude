import { useEffect, useState } from "react";

/**
 * Blob を表示用のURLに変換し、不要になったら解放する（P-02 3.1 手順5）。
 * 解放し忘れるとメモリを使い続けるため、Blob が変わったときと画面を離れるときに解放する
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [entry, setEntry] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 作成したURLを解放と対にして保持するため
    setEntry({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  // 前の Blob のURL（解放済み）を返さないようにする
  return blob && entry?.blob === blob ? entry.url : null;
}
