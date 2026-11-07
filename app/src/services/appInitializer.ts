import {
  DEFAULT_SORT_ORDER,
  isSortOrderId,
  type SortOrderId,
} from "../constants/sortOrders";
import { db } from "../db/database";
import { seed } from "../db/seed";
import {
  SETTING_KEYS,
  settingsRepository,
} from "../repositories/settingsRepository";
import { logger } from "../utils/logger";
import { isStandalone, requestPersist } from "./storageService";

export interface InitialState {
  sortOrder: SortOrderId;
  showInstallBanner: boolean;
}

/**
 * 起動時処理（P-01）。DBを開けない・初期データを投入できない場合は例外を投げる
 * （呼び出し元で MSG-E12 を表示する）
 */
export async function initialize(): Promise<InitialState> {
  logger.info("起動処理を開始します");
  await db.open();
  await seed();

  const sortOrder = await loadSortOrder();

  try {
    const persisted = await requestPersist();
    if (!persisted) logger.warn("永続保存が許可されませんでした");
  } catch (error) {
    logger.warn("永続保存の要求に失敗しました", error);
  }

  const state = { sortOrder, showInstallBanner: !isStandalone() };
  logger.info("起動処理を終了しました");
  return state;
}

async function loadSortOrder(): Promise<SortOrderId> {
  try {
    const value = await settingsRepository.get(SETTING_KEYS.itemSortOrder);
    // 未登録や、廃止された値の場合は初期値に戻す
    return isSortOrderId(value) ? value : DEFAULT_SORT_ORDER;
  } catch (error) {
    logger.warn("並び順の読み込みに失敗しました", error);
    return DEFAULT_SORT_ORDER;
  }
}
