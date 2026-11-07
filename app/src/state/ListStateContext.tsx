import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SortOrderId } from "../constants/sortOrders";
import {
  SETTING_KEYS,
  settingsRepository,
} from "../repositories/settingsRepository";
import { EMPTY_FILTER, type ListFilter } from "../types/models";
import { logger } from "../utils/logger";

// 一覧の条件・並び順・スクロール位置（SC-01 7章、処理設計書 共通 7章）。
// 並び順以外はアプリを開いている間だけ保持する

interface ListStateValue {
  filter: ListFilter;
  setFilter: (update: (current: ListFilter) => ListFilter) => void;
  sortOrder: SortOrderId;
  /** 並び順を変更し、端末に保存する（P-03） */
  changeSortOrder: (order: SortOrderId) => void;
  /** SC-04 へ移動するときにスクロール位置を保存し、戻ったときに1回だけ取り出す */
  saveScroll: (top: number) => void;
  takeScroll: () => number | null;
  showInstallBanner: boolean;
  closeInstallBanner: () => void;
}

const ListStateContext = createContext<ListStateValue | null>(null);

interface Props {
  initialSortOrder: SortOrderId;
  showInstallBanner: boolean;
  children: ReactNode;
}

export function ListStateProvider({
  initialSortOrder,
  showInstallBanner,
  children,
}: Props) {
  const [filter, setFilterState] = useState<ListFilter>(EMPTY_FILTER);
  const [sortOrder, setSortOrder] = useState<SortOrderId>(initialSortOrder);
  const [bannerVisible, setBannerVisible] = useState(showInstallBanner);
  const scroll = useRef<number | null>(null);

  const setFilter = useCallback(
    (update: (current: ListFilter) => ListFilter) => setFilterState(update),
    [],
  );

  const changeSortOrder = useCallback((order: SortOrderId) => {
    setSortOrder(order);
    // 保存に失敗しても表示中の並び順はそのままにし、通知しない（P-03 4章）
    settingsRepository
      .set(SETTING_KEYS.itemSortOrder, order)
      .catch((error: unknown) =>
        logger.warn("並び順の保存に失敗しました", error),
      );
  }, []);

  const saveScroll = useCallback((top: number) => {
    scroll.current = top;
  }, []);

  const takeScroll = useCallback(() => {
    const top = scroll.current;
    scroll.current = null;
    return top;
  }, []);

  const closeInstallBanner = useCallback(() => setBannerVisible(false), []);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      sortOrder,
      changeSortOrder,
      saveScroll,
      takeScroll,
      showInstallBanner: bannerVisible,
      closeInstallBanner,
    }),
    [
      filter,
      setFilter,
      sortOrder,
      changeSortOrder,
      saveScroll,
      takeScroll,
      bannerVisible,
      closeInstallBanner,
    ],
  );

  return (
    <ListStateContext.Provider value={value}>
      {children}
    </ListStateContext.Provider>
  );
}

export function useListState(): ListStateValue {
  const value = useContext(ListStateContext);
  if (!value) throw new Error("ListStateProvider の外では使えません");
  return value;
}
