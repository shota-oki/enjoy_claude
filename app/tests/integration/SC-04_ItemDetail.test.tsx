import { screen, waitFor, within } from "@testing-library/react";
import { db } from "../../src/db/database";
import { itemRepository } from "../../src/repositories/itemRepository";
import { subcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { makeInput, makeNewPhoto, resetDb } from "../helpers";
import { renderApp } from "../renderApp";

beforeEach(resetDb);

async function createItem() {
  const shirt = await subcategoryRepository.add("tops", "シャツ（長袖）");
  return itemRepository.create(
    makeInput({
      name: "ネイビーのオックスフォードシャツ",
      subcategoryId: shirt.id,
      colorId: "navy",
      seasons: ["autumn", "spring"],
      brand: "UNIQLO",
      price: 0,
      purchaseDate: "2026-05-10",
      memo: "1行目\n2行目",
    }),
    [makeNewPhoto(), makeNewPhoto(), makeNewPhoto()],
  );
}

describe("SC-04 アイテム詳細", () => {
  it("全項目を表示する（未入力・0円・季節の順・分類）", async () => {
    const item = await createItem();
    renderApp({ path: `/items/${item.id}` });
    expect(
      await screen.findByRole("heading", {
        name: "ネイビーのオックスフォードシャツ",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("トップス › シャツ（長袖）"),
    ).toBeInTheDocument();
    expect(screen.getByText("ネイビー")).toBeInTheDocument();
    const seasons = screen.getAllByText(/^(春|夏|秋|冬)$/);
    expect(seasons.map((s) => s.textContent)).toEqual(["春", "秋"]);
    expect(screen.getByText("¥0")).toBeInTheDocument();
    expect(screen.getByText("2026/05/10")).toBeInTheDocument();
    expect(screen.getByText("UNIQLO")).toBeInTheDocument();
    // サイズ・素材・洗濯方法・購入店舗は未入力
    expect(screen.getAllByText("未入力")).toHaveLength(4);
    expect(screen.getByText(/1行目\s*2行目/)).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("存在しないアイテムは MSG-E13 を表示して一覧へ戻る", async () => {
    renderApp({ path: "/items/unknown" });
    expect(
      await screen.findByText("アイテムが見つかりませんでした"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();
  });

  it("DL-04 のキャンセルでは削除しない", async () => {
    const item = await createItem();
    const { user } = renderApp({ path: `/items/${item.id}` });
    await user.click(
      await screen.findByRole("button", { name: "このアイテムを削除" }),
    );
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText("このアイテムを削除しますか？"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "「ネイビーのオックスフォードシャツ」を削除します。削除すると元に戻せません。",
      ),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "キャンセル" }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(await itemRepository.get(item.id)).toBeDefined();
  });

  it("削除するとアイテムと写真を消して一覧へ戻り、MSG-I03 を表示する", async () => {
    const item = await createItem();
    const { user } = renderApp({ path: `/items/${item.id}` });
    await user.click(
      await screen.findByRole("button", { name: "このアイテムを削除" }),
    );
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(await screen.findByText("削除しました")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("アイテムが見つかりませんでした")).toBeNull();
    expect(await itemRepository.get(item.id)).toBeUndefined();
    expect(await db.photos.count()).toBe(0);
    expect(await db.thumbnails.count()).toBe(0);
  });

  it("削除に失敗した場合は MSG-E11 を表示して留まる", async () => {
    const item = await createItem();
    vi.spyOn(itemRepository, "remove").mockRejectedValueOnce(new Error("x"));
    const { user } = renderApp({ path: `/items/${item.id}` });
    await user.click(
      await screen.findByRole("button", { name: "このアイテムを削除" }),
    );
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(await screen.findByText(/保存できませんでした/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ネイビーのオックスフォードシャツ" }),
    ).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("一覧のカードから開き、戻ると一覧に戻る", async () => {
    await createItem();
    const { user } = renderApp();
    await user.click(
      await screen.findByRole("button", {
        name: /ネイビーのオックスフォードシャツ/,
      }),
    );
    expect(await screen.findByText("1 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "戻る" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "クローゼット" }),
      ).toBeInTheDocument(),
    );
  });
});
