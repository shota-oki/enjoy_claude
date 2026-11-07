// リポジトリ層が投げる業務上の例外（処理設計書 共通 9章）

/** アイテムが登録されているサブカテゴリを削除しようとした（P-09） */
export class InUseError extends Error {
  readonly count: number;
  constructor(count: number) {
    super("subcategory is in use");
    this.name = "InUseError";
    this.count = count;
  }
}

/** サブカテゴリの件数上限を超える（P-07） */
export class LimitExceededError extends Error {
  constructor() {
    super("subcategory limit exceeded");
    this.name = "LimitExceededError";
  }
}

/** 更新対象のアイテムが存在しない（P-05） */
export class NotFoundError extends Error {
  constructor() {
    super("not found");
    this.name = "NotFoundError";
  }
}

/** 一意制約違反（サブカテゴリ名の重複）かどうか */
export function isConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "ConstraintError") return true;
  // Dexie はトランザクション内の失敗を inner に包んで投げる場合がある
  const inner = (error as { inner?: unknown }).inner;
  return inner instanceof Error && inner.name === "ConstraintError";
}
