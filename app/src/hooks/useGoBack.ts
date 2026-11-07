import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * 呼び出し元の画面へ戻る。アプリ内の履歴がない場合（URLを直接開いた等）は fallback へ移動する。
 * 履歴で戻ることで、一覧の条件・スクロール位置などを呼び出し元の状態のまま表示できる
 */
export function useGoBack(): (fallback: string) => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (fallback: string) => {
      if (location.key !== "default") navigate(-1);
      else navigate(fallback, { replace: true });
    },
    [location.key, navigate],
  );
}
