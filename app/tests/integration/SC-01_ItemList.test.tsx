import { screen, waitFor, within } from "@testing-library/react";
import { db } from "../../src/db/database";
import { itemRepository } from "../../src/repositories/itemRepository";
import { settingsRepository } from "../../src/repositories/settingsRepository";
import { subcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { makeItem, resetDb } from "../helpers";
import { renderApp } from "../renderApp";

beforeEach(resetDb);

/** 一覧に表示されているアイテム名（表示順） */
function shownNames(): string[] {
  return screen
    .queryAllByRole("button")
    .filter((b) => b.querySelector("img, div"))
    .map((b) => b.querySelector("div + div")?.textContent ?? "")
    .filter((name) => name !== "");
}

async function setupItems() {
  const shirt = await subcategoryRepository.add("tops", "シャツ");
  await subcategoryRepository.add("tops", "パーカー");
  await db.items.bulkAdd([
    makeItem({
      name: "白シャツ",
      categoryId: "tops",
      subcategoryId: shirt.id,
      colorId: "white",
      seasons: ["spring"],
      brand: "UNIQLO",
      price: 3000,
      createdAt: 1,
    }),
    makeItem({
      name: "黒T",
      categoryId: "tops",
      subcategoryId: null,
      colorId: "black",
      seasons: ["summer"],
      brand: "GU",
      price: 1000,
      createdAt: 2,
      photoIds: ["a", "b", "c"],
    }),
    makeItem({
      name: "デニム",
      categoryId: "bottoms",
      colorId: "navy",
      brand: null,
      price: null,
      createdAt: 3,
    }),
  ]);
  return { shirt };
}

describe("SC-01 アイテム一覧", () => {
  it("登録0件のときは案内を表示し、チップを表示しない", async () => {
    renderApp();
    expect(
      await screen.findByText(/まだアイテムが登録されていません/),
    ).toBeInTheDocument();
    expect(screen.getByText("0点")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /トップス/ })).toBeNull();
  });

  it("登録日の新しい順に表示し、分類・枚数を表示する", async () => {
    await setupItems();
    renderApp();
    expect(await screen.findByText("3点")).toBeInTheDocument();
    await waitFor(() =>
      expect(shownNames()).toEqual(["デニム", "黒T", "白シャツ"]),
    );
    // サブカテゴリ未設定はカテゴリ名、写真2枚以上は枚数
    const blackT = screen.getByText("黒T").closest("button")!;
    expect(within(blackT).getByText("トップス")).toBeInTheDocument();
    expect(within(blackT).getByText("3枚")).toBeInTheDocument();
    const white = screen.getByText("白シャツ").closest("button")!;
    expect(within(white).getByText("シャツ")).toBeInTheDocument();
  });

  it("カテゴリ・サブカテゴリ（未設定を含む）で絞り込む", async () => {
    await setupItems();
    const { user } = renderApp();
    await user.click(await screen.findByRole("button", { name: "トップス2" }));
    expect(screen.getByText("2 / 3点")).toBeInTheDocument();
    expect(shownNames()).toEqual(["黒T", "白シャツ"]);

    // サブカテゴリ：パーカーは0件、未設定は末尾
    expect(
      await screen.findByRole("button", { name: "パーカー0" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "未設定1" }));
    expect(shownNames()).toEqual(["黒T"]);
    expect(screen.getByText("1 / 3点")).toBeInTheDocument();

    // カテゴリを変えるとサブカテゴリは「すべて」に戻る
    await user.click(screen.getByRole("button", { name: "ボトムス1" }));
    expect(shownNames()).toEqual(["デニム"]);
    await user.click(screen.getByRole("button", { name: "トップス2" }));
    expect(shownNames()).toEqual(["黒T", "白シャツ"]);
  });

  it("並び替えを選ぶと一覧に反映し、端末に保存する", async () => {
    await setupItems();
    const { user } = renderApp();
    await screen.findByText("3点");
    await user.click(screen.getByRole("button", { name: "並び替え" }));
    const sheet = screen.getByRole("dialog", { name: "並び替え" });
    expect(
      within(sheet).getByRole("button", { name: "登録日が新しい順" }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(
      within(sheet).getByRole("button", { name: "購入金額が高い順" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    // 金額未入力は末尾
    expect(shownNames()).toEqual(["白シャツ", "黒T", "デニム"]);
    await waitFor(async () =>
      expect(await settingsRepository.get("itemSortOrder")).toBe("price_desc"),
    );
  });

  it("並び替えのキャンセルでは変更しない", async () => {
    await setupItems();
    const { user } = renderApp();
    await screen.findByText("3点");
    await user.click(screen.getByRole("button", { name: "並び替え" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(shownNames()).toEqual(["デニム", "黒T", "白シャツ"]);
  });

  it("案内バナーを×で閉じる", async () => {
    const { user } = renderApp({ showInstallBanner: true });
    expect(
      await screen.findByText("ホーム画面に追加してご利用ください"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "案内を閉じる" }));
    expect(screen.queryByText("ホーム画面に追加してご利用ください")).toBeNull();
  });
});

describe("SC-02 絞り込み", () => {
  it("シート内の条件は「○件を表示」で反映し、タグ・バッジを表示する", async () => {
    await setupItems();
    const { user } = renderApp();
    await screen.findByText("3点");
    await user.click(screen.getByRole("button", { name: "絞り込み" }));
    const sheet = screen.getByRole("dialog", { name: "絞り込み" });
    expect(
      within(sheet).getByRole("button", { name: "3件を表示" }),
    ).toBeEnabled();

    await user.click(within(sheet).getByRole("button", { name: "白" }));
    await user.click(within(sheet).getByRole("button", { name: "黒" }));
    expect(
      within(sheet).getByRole("button", { name: "2件を表示" }),
    ).toBeEnabled();
    // 一覧にはまだ反映しない
    expect(shownNames()).toHaveLength(3);

    await user.click(within(sheet).getByRole("button", { name: "夏" }));
    await user.click(within(sheet).getByRole("button", { name: "1件を表示" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(shownNames()).toEqual(["黒T"]);
    expect(screen.getByText("1 / 3点")).toBeInTheDocument();

    // バッジは条件数（色2＋季節1）
    expect(
      within(screen.getByRole("button", { name: "絞り込み" })).getByText("3"),
    ).toBeInTheDocument();

    // タグの×で1つ解除、「クリア」で全解除（カテゴリは残る）
    await user.click(screen.getAllByRole("button", { name: "条件を解除" })[2]);
    expect(shownNames()).toEqual(["黒T", "白シャツ"]);
    await user.click(screen.getByRole("button", { name: "クリア" }));
    expect(shownNames()).toHaveLength(3);
  });

  it("該当0件の条件では押せない。閉じると変更を破棄する", async () => {
    await setupItems();
    const { user } = renderApp();
    await screen.findByText("3点");
    await user.click(screen.getByRole("button", { name: "絞り込み" }));
    const sheet = screen.getByRole("dialog", { name: "絞り込み" });
    await user.click(within(sheet).getByRole("button", { name: "赤" }));
    expect(
      within(sheet).getByRole("button", {
        name: "該当するアイテムがありません",
      }),
    ).toBeDisabled();
    await user.click(within(sheet).getByRole("button", { name: "閉じる" }));
    expect(shownNames()).toHaveLength(3);

    // リセットはシート内の選択だけを解除する
    await user.click(screen.getByRole("button", { name: "絞り込み" }));
    const again = screen.getByRole("dialog", { name: "絞り込み" });
    expect(within(again).getByRole("button", { name: "赤" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("ブランドは名前順で表示し、該当がなくなったブランドは条件から外れる", async () => {
    await setupItems();
    const { user } = renderApp();
    await screen.findByText("3点");
    await user.click(screen.getByRole("button", { name: "絞り込み" }));
    const sheet = screen.getByRole("dialog", { name: "絞り込み" });
    const brandButtons = within(sheet)
      .getAllByRole("button")
      .filter((b) => ["GU", "UNIQLO"].includes(b.textContent ?? ""));
    expect(brandButtons.map((b) => b.textContent)).toEqual(["GU", "UNIQLO"]);
    await user.click(brandButtons[0]);
    await user.click(within(sheet).getByRole("button", { name: "1件を表示" }));
    expect(shownNames()).toEqual(["黒T"]);

    // GU のアイテムを削除すると条件から GU が外れる
    const blackT = (await itemRepository.listAll()).find(
      (i) => i.brand === "GU",
    )!;
    await itemRepository.remove(blackT.id);
    await waitFor(() => expect(shownNames()).toHaveLength(2));
    expect(screen.queryByRole("button", { name: "条件を解除" })).toBeNull();
  });

  it("該当0件のときは「条件をすべてクリア」でカテゴリも解除する", async () => {
    await setupItems();
    const { user } = renderApp();
    await user.click(await screen.findByRole("button", { name: "ボトムス1" }));
    await user.click(screen.getByRole("button", { name: "絞り込み" }));
    await user.click(screen.getByRole("button", { name: "白" }));
    // カテゴリ「ボトムス」×白は0件のため押せない
    expect(
      screen.getByRole("button", { name: "該当するアイテムがありません" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "閉じる" }));

    // 条件に合うアイテムを削除して該当0件にする
    const denim = (await itemRepository.listAll()).find(
      (i) => i.name === "デニム",
    )!;
    await itemRepository.remove(denim.id);
    await user.click(
      await screen.findByRole("button", { name: "条件をすべてクリア" }),
    );
    expect(shownNames()).toEqual(["黒T", "白シャツ"]);
  });
});
