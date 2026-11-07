import { db } from "../db/database";

export const photoRepository = {
  /** 一覧用画像をまとめて取得する（P-02）。見つからないIDは含めない */
  async getThumbnails(photoIds: readonly string[]): Promise<Map<string, Blob>> {
    const rows = await db.thumbnails.bulkGet([...photoIds]);
    const result = new Map<string, Blob>();
    rows.forEach((row) => {
      if (row) result.set(row.photoId, row.image);
    });
    return result;
  },

  /** 写真の画像を取得する（SC-04 の写真表示） */
  async getImage(photoId: string): Promise<Blob | undefined> {
    const row = await db.photos.get(photoId);
    return row?.image;
  },

  /** photos と thumbnails の byteSize の合計（P-10） */
  async totalByteSize(): Promise<number> {
    let total = 0;
    await db.photos.each((p) => {
      total += p.byteSize;
    });
    await db.thumbnails.each((t) => {
      total += t.byteSize;
    });
    return total;
  },
};
