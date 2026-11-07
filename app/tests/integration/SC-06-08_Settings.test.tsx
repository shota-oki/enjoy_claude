import { screen, waitFor, within } from "@testing-library/react";
import { itemRepository } from "../../src/repositories/itemRepository";
import { subcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { makeInput, makeNewPhoto, resetDb } from "../helpers";
import { renderApp } from "../renderApp";
import pkg from "../../package.json";

beforeEach(resetDb);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** サブカテゴリ行の名前（表示順） */
async function rowNames(): Promise<string[]> {
  const heading = await screen.findByRole("heading", {
    name: /サブカテゴリ（/,
  });
  const group = heading.nextElementSibling as HTMLElement;
  return within(group)
    .queryAllByRole("button", { name: /を削除$|を上へ$/ })
    .map((b) =>
      (b.getAttribute("aria-label") ?? "").replace(/を(削除|上へ)$/, ""),
    );
}

describe("SC-06 設定", () => {
  it("登録件数・保存容量・永続保存・バージョンを表示する", async () => {
    await itemRepository.create(makeInput(), [makeNewPhoto(100)]);
    renderApp({ path: "/settings" });
    expect(await screen.findByText("1点")).toBeInTheDocument();
    expect(await screen.findByText("1MB未満")).toBeInTheDocument();
    // jsdom には永続保存の機能がないため「未許可」と案内文
    expect(await screen.findByText("未許可")).toBeInTheDocument();
    expect(
      screen.getByText("ホーム画面に追加して開くと有効になります。"),
    ).toBeInTheDocument();
    expect(screen.getByText(pkg.version)).toBeInTheDocument();
  });

  it("永続保存が有効なら案内文を出さない。取得に失敗した項目は「―」", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      storage: { persisted: async () => true },
    });
    vi.spyOn(itemRepository, "count").mockRejectedValue(new Error("x"));
    renderApp({ path: "/settings" });
    expect(await screen.findByText("有効")).toBeInTheDocument();
    expect(await screen.findByText("―")).toBeInTheDocument();
    expect(
      screen.queryByText("ホーム画面に追加して開くと有効になります。"),
    ).toBeNull();
  });

  it("サブカテゴリ管理 → カテゴリ選択 → 編集、戻るで設定へ", async () => {
    await subcategoryRepository.add("hat", "キャップ");
    await subcategoryRepository.add("hat", "ハット");
    const { user } = renderApp({ path: "/settings" });
    await user.click(
      await screen.findByRole("button", { name: /サブカテゴリ管理/ }),
    );
    // SC-07 件数（0件のカテゴリも表示）
    expect(
      await screen.findByRole("button", { name: /帽子\s*2件/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /その他\s*0件/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /帽子/ }));
    expect(
      await screen.findByRole("heading", { name: "帽子" }),
    ).toBeInTheDocument();
    expect(await rowNames()).toEqual(["キャップ", "ハット"]);

    await user.click(screen.getByRole("button", { name: "戻る" }));
    await user.click(
      within(await screen.findByRole("banner")).getByRole("button", {
        name: "設定",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "設定" }),
    ).toBeInTheDocument();
  });
});

describe("SC-08 サブカテゴリ編集", () => {
  it("0件のカテゴリは「サブカテゴリはありません」、並び替えは押せない", async () => {
    renderApp({ path: "/settings/subcategories/other" });
    expect(
      await screen.findByText("サブカテゴリはありません"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "並び替え" })).toBeDisabled();
  });

  it("追加：空の間は押せない、重複は MSG-E14、成功で MSG-I04", async () => {
    await subcategoryRepository.add("bottoms", "デニム");
    const { user } = renderApp({ path: "/settings/subcategories/bottoms" });
    await user.click(
      await screen.findByRole("button", { name: "サブカテゴリを追加" }),
    );
    const dialog = screen.getByRole("alertdialog", {
      name: "サブカテゴリを追加",
    });
    expect(
      within(dialog).getByText("「ボトムス」に追加します"),
    ).toBeInTheDocument();
    const input = within(dialog).getByRole("textbox", {
      name: "サブカテゴリ名",
    });
    expect(input).toHaveFocus();
    expect(within(dialog).getByRole("button", { name: "追加" })).toBeDisabled();
    await user.type(input, "　 ");
    expect(within(dialog).getByRole("button", { name: "追加" })).toBeDisabled();

    await user.clear(input);
    await user.type(input, " デニム ");
    await user.click(within(dialog).getByRole("button", { name: "追加" }));
    expect(
      within(dialog).getByText("同じ名前のサブカテゴリが既に存在します"),
    ).toBeInTheDocument();
    // 入力するとエラーが消える
    await user.clear(input);
    expect(
      within(dialog).queryByText("同じ名前のサブカテゴリが既に存在します"),
    ).toBeNull();

    // 改行キーで確定
    await user.type(input, "ジョガーパンツ{Enter}");
    expect(await screen.findByText("追加しました")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(await rowNames()).toEqual(["デニム", "ジョガーパンツ"]);
  });

  it("30件の場合は MSG-E15 を表示し、ダイアログを出さない", async () => {
    for (let i = 0; i < 30; i++)
      await subcategoryRepository.add("other", `S${i}`);
    const { user } = renderApp({ path: "/settings/subcategories/other" });
    await user.click(
      await screen.findByRole("button", { name: "サブカテゴリを追加" }),
    );
    expect(
      screen.getByText("サブカテゴリは1つのカテゴリにつき30件まで登録できます"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("名称変更：同じ名前なら何もせず閉じ、変更すると MSG-I05", async () => {
    await subcategoryRepository.add("bottoms", "デニム");
    await subcategoryRepository.add("bottoms", "チノパン");
    const { user } = renderApp({ path: "/settings/subcategories/bottoms" });
    await user.click(
      await screen.findByRole("button", { name: "デニムの名称を変更" }),
    );
    const dialog = screen.getByRole("alertdialog", { name: "名称を変更" });
    const input = within(dialog).getByRole("textbox");
    expect(input).toHaveValue("デニム");
    await user.click(within(dialog).getByRole("button", { name: "変更" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByText("名称を変更しました")).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "デニムの名称を変更" }),
    );
    const again = screen.getByRole("alertdialog");
    await user.clear(within(again).getByRole("textbox"));
    await user.type(within(again).getByRole("textbox"), "チノパン");
    await user.click(within(again).getByRole("button", { name: "変更" }));
    expect(
      within(again).getByText("同じ名前のサブカテゴリが既に存在します"),
    ).toBeInTheDocument();
    await user.clear(within(again).getByRole("textbox"));
    await user.type(within(again).getByRole("textbox"), "ジーンズ");
    await user.click(within(again).getByRole("button", { name: "変更" }));
    expect(await screen.findByText("名称を変更しました")).toBeInTheDocument();
    expect(await rowNames()).toEqual(["ジーンズ", "チノパン"]);
  });

  it("並び替え：上下ボタンで入れ替えて保存し、完了で通常モードに戻る", async () => {
    await subcategoryRepository.add("bag", "A");
    await subcategoryRepository.add("bag", "B");
    await subcategoryRepository.add("bag", "C");
    const { user } = renderApp({ path: "/settings/subcategories/bag" });
    await user.click(await screen.findByRole("button", { name: "並び替え" }));
    expect(
      screen.queryByRole("button", { name: "サブカテゴリを追加" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Aを上へ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cを下へ" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Cを上へ" }));
    await waitFor(async () =>
      expect(await rowNames()).toEqual(["A", "C", "B"]),
    );
    const saved = await subcategoryRepository.listByCategory("bag");
    expect(saved.map((s) => s.name)).toEqual(["A", "C", "B"]);

    await user.click(screen.getByRole("button", { name: "完了" }));
    expect(
      screen.getByRole("button", { name: "サブカテゴリを追加" }),
    ).toBeInTheDocument();
  });

  it("削除：アイテムがあれば削除不可通知、なければ確認して削除（MSG-I03）", async () => {
    const used = await subcategoryRepository.add("tops", "シャツ");
    await subcategoryRepository.add("tops", "パーカー");
    await itemRepository.create(
      makeInput({ categoryId: "tops", subcategoryId: used.id }),
      [makeNewPhoto()],
    );
    const { user } = renderApp({ path: "/settings/subcategories/tops" });
    expect(await screen.findByText("1点")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "シャツを削除" }));
    const notice = screen.getByRole("alertdialog", { name: "削除できません" });
    expect(
      within(notice).getByText(
        "「シャツ」には1点のアイテムが登録されています。アイテムのサブカテゴリを変更してから削除してください。",
      ),
    ).toBeInTheDocument();
    await user.click(within(notice).getByRole("button", { name: "OK" }));

    await user.click(screen.getByRole("button", { name: "パーカーを削除" }));
    const confirm = screen.getByRole("alertdialog", {
      name: "「パーカー」を削除しますか？",
    });
    await user.click(within(confirm).getByRole("button", { name: "削除" }));
    expect(await screen.findByText("削除しました")).toBeInTheDocument();
    expect(await rowNames()).toEqual(["シャツ"]);
  });

  it("確認中にアイテムが登録された場合は削除不可通知に切り替える", async () => {
    const sub = await subcategoryRepository.add("tops", "シャツ");
    const { user } = renderApp({ path: "/settings/subcategories/tops" });
    await user.click(
      await screen.findByRole("button", { name: "シャツを削除" }),
    );
    await itemRepository.create(
      makeInput({ categoryId: "tops", subcategoryId: sub.id }),
      [makeNewPhoto()],
    );
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(
      await screen.findByRole("alertdialog", { name: "削除できません" }),
    ).toBeInTheDocument();
  });

  it("一覧で選択中のサブカテゴリを削除すると、一覧の選択は「すべて」に戻る", async () => {
    const shirt = await subcategoryRepository.add("tops", "シャツ");
    await subcategoryRepository.add("tops", "パーカー");
    await itemRepository.create(
      makeInput({ categoryId: "tops", name: "白T" }),
      [makeNewPhoto()],
    );
    const { user } = renderApp();
    await user.click(await screen.findByRole("button", { name: "トップス1" }));
    await user.click(await screen.findByRole("button", { name: "シャツ0" }));
    expect(screen.getByText("0 / 1点")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "設定" }));
    await user.click(
      await screen.findByRole("button", { name: /サブカテゴリ管理/ }),
    );
    await user.click(await screen.findByRole("button", { name: /トップス/ }));
    await user.click(
      await screen.findByRole("button", { name: "シャツを削除" }),
    );
    await user.click(screen.getByRole("button", { name: "削除" }));
    await screen.findByText("削除しました");
    expect(
      await subcategoryRepository.listByCategory("tops"),
    ).not.toContainEqual(expect.objectContaining({ id: shirt.id }));

    await user.click(screen.getByRole("button", { name: "クローゼット" }));
    expect(await screen.findByText("1 / 1点")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "すべて" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("存在しないカテゴリのURLは一覧へ", async () => {
    renderApp({ path: "/settings/subcategories/unknown" });
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();
  });
});
