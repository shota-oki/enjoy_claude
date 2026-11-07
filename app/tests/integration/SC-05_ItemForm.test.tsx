import { screen, waitFor, within } from "@testing-library/react";
import { db } from "../../src/db/database";
import { itemRepository } from "../../src/repositories/itemRepository";
import { subcategoryRepository } from "../../src/repositories/subcategoryRepository";
import * as imageProcessor from "../../src/services/imageProcessor";
import { makeInput, makeNewPhoto, resetDb } from "../helpers";
import { renderApp } from "../renderApp";

beforeEach(async () => {
  await resetDb();
  // jsdom では画像を変換できないため、変換結果を差し替える
  vi.spyOn(imageProcessor, "process").mockImplementation(async (file) => {
    if ((file as File).name === "broken.jpg") {
      throw new imageProcessor.ImageLoadError();
    }
    return makeNewPhoto();
  });
});

afterEach(() => vi.restoreAllMocks());

const jpeg = (name = "a.jpg") => new File(["x"], name, { type: "image/jpeg" });

describe("SC-05 アイテム登録", () => {
  it("未入力で保存するとエラーをまとめて表示し、入力するとそのエラーが消える", async () => {
    const { user } = renderApp({ path: "/items/new" });
    await user.click(await screen.findByRole("button", { name: "保存" }));
    expect(screen.getByText("入力内容を確認してください")).toBeInTheDocument();
    expect(
      screen.getByText("写真を1枚以上登録してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("名前を入力してください")).toBeInTheDocument();
    expect(screen.getByText("カテゴリを選択してください")).toBeInTheDocument();
    expect(
      screen.getByText("ベースカラーを選択してください"),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/名前/), "白T");
    expect(screen.queryByText("名前を入力してください")).toBeNull();
    expect(await itemRepository.count()).toBe(0);
  });

  it("入力して登録すると一覧へ戻り MSG-I01 を表示する", async () => {
    await subcategoryRepository.add("tops", "Tシャツ（半袖）");
    const { user } = renderApp({ path: "/items/new" });

    // DL-01 フォトライブラリから2枚追加
    await user.click(await screen.findByRole("button", { name: /写真を追加/ }));
    expect(
      screen.getByRole("dialog", { name: "写真を追加（あと10枚）" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "フォトライブラリから選択" }),
    );
    await user.upload(screen.getByTestId("library-input"), [jpeg(), jpeg()]);
    expect(await screen.findByText("代表")).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 10枚/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/名前/), "  白の無地Tシャツ ");
    await user.selectOptions(screen.getByLabelText(/^カテゴリ/), "tops");
    // 選択肢の読み込みを待つ（読み込み中に「なし」を表示しないこと）
    expect(screen.queryByText("なし")).toBeNull();
    await screen.findByRole("option", { name: "Tシャツ（半袖）" });
    await user.selectOptions(
      screen.getByLabelText("サブカテゴリ"),
      "Tシャツ（半袖）",
    );
    await user.click(screen.getByRole("button", { name: "白" }));
    await user.click(screen.getByRole("button", { name: "夏" }));
    await user.click(screen.getByRole("button", { name: "春" }));
    // 全角数字は半角に、数字以外は入力されない
    await user.type(screen.getByLabelText("購入金額"), "１２a00");
    expect(screen.getByLabelText("購入金額")).toHaveValue("1200");
    await user.type(screen.getByLabelText("サイズ"), "M");

    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByText("登録しました")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();

    const [item] = await itemRepository.listAll();
    expect(item).toMatchObject({
      name: "白の無地Tシャツ",
      categoryId: "tops",
      colorId: "white",
      seasons: ["spring", "summer"],
      price: 1200,
      size: "M",
      brand: null,
    });
    expect(item.photoIds).toHaveLength(2);
    expect(await db.photos.count()).toBe(2);
  });

  it("一覧で選択中のカテゴリ・サブカテゴリを初期値にする", async () => {
    const sub = await subcategoryRepository.add("bottoms", "デニム");
    await itemRepository.create(
      makeInput({ categoryId: "bottoms", subcategoryId: sub.id }),
      [makeNewPhoto()],
    );
    const { user } = renderApp();
    await user.click(await screen.findByRole("button", { name: "ボトムス1" }));
    await user.click(await screen.findByRole("button", { name: "デニム1" }));
    await user.click(screen.getByRole("button", { name: "アイテム登録" }));
    expect(await screen.findByLabelText(/^カテゴリ/)).toHaveValue("bottoms");
    expect(screen.getByLabelText("サブカテゴリ")).toHaveValue(sub.id);

    // カテゴリを変えるとサブカテゴリは未選択に戻る（その他はサブカテゴリなし）
    await user.selectOptions(screen.getByLabelText(/^カテゴリ/), "other");
    expect(screen.getByText("なし")).toBeInTheDocument();
  });

  it("上限を超えた分は追加せず MSG-E09、読めない写真は MSG-E10", async () => {
    const { user } = renderApp({ path: "/items/new" });
    await user.click(await screen.findByRole("button", { name: /写真を追加/ }));
    await user.click(
      screen.getByRole("button", { name: "フォトライブラリから選択" }),
    );
    await user.upload(
      screen.getByTestId("library-input"),
      Array.from({ length: 12 }, () => jpeg()),
    );
    expect(
      await screen.findByText(
        "写真は最大10枚までです。先頭から10枚を追加しました",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/10 \/ 10枚/)).toBeInTheDocument();
    // 10枚のときは「写真を追加」を表示しない
    expect(screen.queryByRole("button", { name: /写真を追加/ })).toBeNull();

    // 1枚削除して読めない写真を追加
    await user.click(screen.getByRole("button", { name: "写真 10枚目" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    await user.click(screen.getByRole("button", { name: /写真を追加/ }));
    await user.click(
      screen.getByRole("button", { name: "フォトライブラリから選択" }),
    );
    await user.upload(screen.getByTestId("library-input"), [
      jpeg("broken.jpg"),
    ]);
    expect(
      await screen.findByText("写真を読み込めませんでした"),
    ).toBeInTheDocument();
    expect(screen.getByText(/9 \/ 10枚/)).toBeInTheDocument();
  });

  it("DL-02 で代表写真を変更できる", async () => {
    const { user } = renderApp({ path: "/items/new" });
    await user.click(await screen.findByRole("button", { name: /写真を追加/ }));
    await user.click(screen.getByRole("button", { name: "写真を撮る" }));
    await user.upload(screen.getByTestId("camera-input"), jpeg());
    await user.click(await screen.findByRole("button", { name: /写真を追加/ }));
    await user.click(screen.getByRole("button", { name: "写真を撮る" }));
    await user.upload(screen.getByTestId("camera-input"), jpeg());

    await user.click(await screen.findByRole("button", { name: "代表写真" }));
    // 1枚目には「代表写真にする」を出さない
    expect(screen.queryByRole("button", { name: "代表写真にする" })).toBeNull();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "キャンセル",
      }),
    );

    const second = screen.getByRole("button", { name: "写真 2枚目" });
    await user.click(second);
    await user.click(screen.getByRole("button", { name: "代表写真にする" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("変更なしのキャンセルはそのまま戻り、変更ありは DL-03 を表示する", async () => {
    const { user } = renderApp({ path: "/items/new" });
    await user.click(await screen.findByRole("button", { name: "キャンセル" }));
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();
  });

  it("入力して元に戻した場合は変更なしとして扱う", async () => {
    const { user } = renderApp({ path: "/items/new" });
    const name = await screen.findByLabelText(/名前/);
    await user.type(name, "a");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText("登録を中止しますか？"),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "入力を続ける" }),
    );
    expect(name).toHaveValue("a");

    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();
  });

  it("購入金額の上限と未来の購入日はエラーにする", async () => {
    const { user } = renderApp({ path: "/items/new" });
    const price = await screen.findByLabelText("購入金額");
    await user.type(price, "123456789");
    // 7桁までしか入力できない
    expect(price).toHaveValue("1234567");
    const date = screen.getByLabelText("購入日");
    await user.type(date, "2999-01-01");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(
      screen.getByText("購入日に未来の日付は指定できません"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "クリア" }));
    expect(date).toHaveValue("");
  });

  it("保存に失敗した場合は MSG-E11 を表示し、入力内容を保持する", async () => {
    vi.spyOn(itemRepository, "create").mockRejectedValueOnce(
      new Error("QuotaExceededError"),
    );
    const { user } = renderApp({ path: "/items/new" });
    await user.click(await screen.findByRole("button", { name: /写真を追加/ }));
    await user.click(screen.getByRole("button", { name: "写真を撮る" }));
    await user.upload(screen.getByTestId("camera-input"), jpeg());
    await user.type(screen.getByLabelText(/名前/), "白T");
    await user.selectOptions(screen.getByLabelText(/^カテゴリ/), "tops");
    await user.click(screen.getByRole("button", { name: "白" }));
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByText(/保存できませんでした/)).toBeInTheDocument();
    expect(screen.getByLabelText(/名前/)).toHaveValue("白T");
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
  });
});

describe("SC-05 アイテム編集", () => {
  async function createItem() {
    return itemRepository.create(
      makeInput({ name: "黒T", colorId: "black", price: 0 }),
      [makeNewPhoto(), makeNewPhoto()],
    );
  }

  it("登録値を表示し、保存すると詳細へ戻り MSG-I02 を表示する", async () => {
    const item = await createItem();
    const { user } = renderApp({ path: `/items/${item.id}` });
    await user.click(await screen.findByRole("button", { name: "編集" }));
    expect(
      await screen.findByRole("heading", { name: "アイテム編集" }),
    ).toBeInTheDocument();
    const name = screen.getByLabelText(/名前/);
    expect(name).toHaveValue("黒T");
    expect(screen.getByLabelText("購入金額")).toHaveValue("0");

    // 1枚目の写真を削除して名前を変更
    await user.click(screen.getByRole("button", { name: "代表写真" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    await user.clear(name);
    await user.type(name, "黒Tシャツ");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("保存しました")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "黒Tシャツ" }),
    ).toBeInTheDocument();
    const updated = await itemRepository.get(item.id);
    expect(updated?.photoIds).toEqual([item.photoIds[1]]);
    expect(updated?.createdAt).toBe(item.createdAt);
    expect(await db.photos.count()).toBe(1);
  });

  it("写真が1枚のときは削除できない（MSG-E08）", async () => {
    const item = await itemRepository.create(makeInput(), [makeNewPhoto()]);
    const { user } = renderApp({ path: `/items/${item.id}/edit` });
    await user.click(await screen.findByRole("button", { name: "代表写真" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(screen.getByText("写真は1枚以上必要です")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "代表写真" }),
    ).toBeInTheDocument();
  });

  it("変更してキャンセルすると DL-03（変更を破棄しますか？）、破棄で詳細に戻る", async () => {
    const item = await createItem();
    const { user } = renderApp({ path: `/items/${item.id}` });
    await user.click(await screen.findByRole("button", { name: "編集" }));
    await user.click(await screen.findByRole("button", { name: "冬" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText("変更を破棄しますか？"),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "破棄" }));
    expect(
      await screen.findByRole("heading", { name: "黒T" }),
    ).toBeInTheDocument();
    await waitFor(async () =>
      expect((await itemRepository.get(item.id))?.seasons).toEqual([]),
    );
  });

  it("存在しないアイテムの編集は MSG-E13 で一覧へ", async () => {
    renderApp({ path: "/items/unknown/edit" });
    expect(
      await screen.findByText("アイテムが見つかりませんでした"),
    ).toBeInTheDocument();
  });
});
