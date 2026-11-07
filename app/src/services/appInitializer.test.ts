import { settingsRepository } from "../repositories/settingsRepository";
import { subcategoryRepository } from "../repositories/subcategoryRepository";
import { initialize } from "./appInitializer";
import { resetDb } from "../../tests/helpers";

beforeEach(resetDb);

describe("initialize", () => {
  it("初期サブカテゴリを投入し、並び順の初期値を返す", async () => {
    const state = await initialize();
    expect(state.sortOrder).toBe("created_desc");
    expect(state.showInstallBanner).toBe(true);
    expect(await subcategoryRepository.listAll()).toHaveLength(46);
  });

  it("保存済みの並び順を引き継ぐ", async () => {
    await settingsRepository.set("itemSortOrder", "price_asc");
    expect((await initialize()).sortOrder).toBe("price_asc");
  });

  it("定義にない並び順は初期値に戻す", async () => {
    await settingsRepository.set("itemSortOrder", "removed_order");
    expect((await initialize()).sortOrder).toBe("created_desc");
  });

  it("2回目の起動で再投入しない", async () => {
    await initialize();
    await initialize();
    expect(await subcategoryRepository.listAll()).toHaveLength(46);
  });
});
