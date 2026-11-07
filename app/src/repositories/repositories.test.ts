import { db } from "../db/database";
import { seed } from "../db/seed";
import { InUseError, LimitExceededError, isConstraintError } from "./errors";
import { itemRepository } from "./itemRepository";
import { photoRepository } from "./photoRepository";
import { settingsRepository } from "./settingsRepository";
import { subcategoryRepository } from "./subcategoryRepository";
import { makeInput, makeNewPhoto, resetDb } from "../../tests/helpers";

beforeEach(resetDb);

describe("itemRepository", () => {
  it("登録で items・photos・thumbnails がそろって追加される", async () => {
    const item = await itemRepository.create(makeInput(), [
      makeNewPhoto(100),
      makeNewPhoto(200),
    ]);
    expect(item.photoIds).toHaveLength(2);
    expect(item.createdAt).toBe(item.updatedAt);
    expect(await db.photos.where("itemId").equals(item.id).count()).toBe(2);
    expect((await photoRepository.getThumbnails(item.photoIds)).size).toBe(2);
    expect(await photoRepository.totalByteSize()).toBe(100 + 10 + 200 + 20);
    expect(await itemRepository.count()).toBe(1);
  });

  it("更新で取り除いた写真を削除し、追加した写真を足し、並びを保つ", async () => {
    const item = await itemRepository.create(makeInput({ name: "前" }), [
      makeNewPhoto(),
      makeNewPhoto(),
    ]);
    const [first, second] = item.photoIds;
    const updated = await itemRepository.update(
      item.id,
      makeInput({ name: "後" }),
      [
        { kind: "new", photo: makeNewPhoto() },
        { kind: "existing", photoId: second },
      ],
    );
    expect(updated.name).toBe("後");
    expect(updated.createdAt).toBe(item.createdAt);
    expect(updated.photoIds[1]).toBe(second);
    expect(updated.photoIds).not.toContain(first);
    expect(await db.photos.get(first)).toBeUndefined();
    expect(await db.thumbnails.get(first)).toBeUndefined();
    expect(await db.photos.count()).toBe(2);
    expect(await db.thumbnails.count()).toBe(2);
  });

  it("途中で失敗した場合はすべて取り消される", async () => {
    const item = await itemRepository.create(makeInput({ name: "前" }), [
      makeNewPhoto(),
    ]);
    // 既存の写真IDと同じIDの一覧用画像がある状態で追加させて失敗させる代わりに、
    // items.put を失敗させる
    const spy = vi
      .spyOn(db.items, "put")
      .mockRejectedValueOnce(new Error("QuotaExceededError"));
    await expect(
      itemRepository.update(item.id, makeInput({ name: "後" }), [
        { kind: "new", photo: makeNewPhoto() },
      ]),
    ).rejects.toThrow();
    spy.mockRestore();
    expect((await itemRepository.get(item.id))?.name).toBe("前");
    expect(await db.photos.count()).toBe(1);
    expect(await db.thumbnails.count()).toBe(1);
  });

  it("削除で写真・一覧用画像もすべて消える。存在しなくてもエラーにしない", async () => {
    const item = await itemRepository.create(makeInput(), [
      makeNewPhoto(),
      makeNewPhoto(),
    ]);
    const other = await itemRepository.create(makeInput(), [makeNewPhoto()]);
    await itemRepository.remove(item.id);
    expect(await itemRepository.get(item.id)).toBeUndefined();
    expect(await db.photos.count()).toBe(1);
    expect(await db.thumbnails.count()).toBe(1);
    expect(await itemRepository.get(other.id)).toBeDefined();
    await expect(itemRepository.remove(item.id)).resolves.toBeUndefined();
  });

  it("サブカテゴリごとの件数", async () => {
    await itemRepository.create(makeInput({ subcategoryId: "s1" }), [
      makeNewPhoto(),
    ]);
    await itemRepository.create(makeInput({ subcategoryId: "s1" }), [
      makeNewPhoto(),
    ]);
    await itemRepository.create(makeInput({ subcategoryId: null }), [
      makeNewPhoto(),
    ]);
    await itemRepository.create(
      makeInput({ categoryId: "bag", subcategoryId: "s2" }),
      [makeNewPhoto()],
    );
    const counts = await itemRepository.countBySubcategory("tops");
    expect(counts.get("s1")).toBe(2);
    expect(counts.has("s2")).toBe(false);
  });
});

describe("subcategoryRepository", () => {
  it("末尾に追加し、表示順は最大値＋10", async () => {
    const a = await subcategoryRepository.add("other", "A");
    const b = await subcategoryRepository.add("other", "B");
    expect(a.sortOrder).toBe(10);
    expect(b.sortOrder).toBe(20);
    expect(
      (await subcategoryRepository.listByCategory("other")).map((s) => s.name),
    ).toEqual(["A", "B"]);
  });

  it("同じカテゴリ内の重複名は一意制約で失敗し、別カテゴリなら追加できる", async () => {
    await subcategoryRepository.add("other", "A");
    const error = await subcategoryRepository
      .add("other", "A")
      .catch((e: unknown) => e);
    expect(isConstraintError(error)).toBe(true);
    await expect(subcategoryRepository.add("hat", "A")).resolves.toBeDefined();
  });

  it("30件を超えて追加できない", async () => {
    for (let i = 0; i < 30; i++)
      await subcategoryRepository.add("other", `S${i}`);
    await expect(
      subcategoryRepository.add("other", "over"),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });

  it("名称変更と表示順の入れ替え", async () => {
    const a = await subcategoryRepository.add("other", "A");
    const b = await subcategoryRepository.add("other", "B");
    await subcategoryRepository.rename(a.id, "A2");
    await subcategoryRepository.swapOrder(a.id, b.id);
    const list = await subcategoryRepository.listByCategory("other");
    expect(list.map((s) => s.name)).toEqual(["B", "A2"]);
  });

  it("アイテムがあるサブカテゴリは削除できない", async () => {
    const s = await subcategoryRepository.add("tops", "X");
    const item = await itemRepository.create(
      makeInput({ subcategoryId: s.id }),
      [makeNewPhoto()],
    );
    const error = await subcategoryRepository
      .remove(s.id)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InUseError);
    expect((error as InUseError).count).toBe(1);

    await itemRepository.remove(item.id);
    await subcategoryRepository.remove(s.id);
    expect(await subcategoryRepository.listByCategory("tops")).toEqual([]);
    // 存在しない場合もエラーにしない
    await expect(subcategoryRepository.remove(s.id)).resolves.toBeUndefined();
  });
});

describe("seed・settings", () => {
  it("初期サブカテゴリは初回のみ投入され、全件削除後も再投入されない", async () => {
    await seed();
    const all = await subcategoryRepository.listAll();
    expect(all).toHaveLength(46);
    const tops = await subcategoryRepository.listByCategory("tops");
    expect(tops[0]).toMatchObject({ name: "Tシャツ（半袖）", sortOrder: 10 });
    expect(tops.at(-1)).toMatchObject({ name: "タンクトップ", sortOrder: 90 });

    await db.subcategories.clear();
    await seed();
    expect(await subcategoryRepository.listAll()).toHaveLength(0);
  });

  it("設定値の保存と取得", async () => {
    expect(await settingsRepository.get("itemSortOrder")).toBeUndefined();
    await settingsRepository.set("itemSortOrder", "name_asc");
    expect(await settingsRepository.get("itemSortOrder")).toBe("name_asc");
  });
});
