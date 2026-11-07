/** UUID を生成する（DB設計書 共通 2章） */
export function newId(): string {
  return crypto.randomUUID();
}
