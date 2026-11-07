import { act, screen, waitFor } from "@testing-library/react";
import { UPDATE_CHECK_INTERVAL_MS } from "../../src/constants/limits";
import {
  updateService,
  type RegisterSW,
} from "../../src/services/updateService";
import { resetDb } from "../helpers";
import { renderApp } from "../renderApp";

/** Service Worker の登録を模したもの */
function fakeRegister() {
  const registration = {
    update: vi.fn(async () => {}),
    waiting: null as ServiceWorker | null,
  };
  const applyUpdate = vi.fn(async () => {});
  let onNeedRefresh: (() => void) | undefined;
  const register: RegisterSW = (options) => {
    onNeedRefresh = options.onNeedRefresh;
    options.onRegisteredSW?.(
      "sw.js",
      registration as unknown as ServiceWorkerRegistration,
    );
    return applyUpdate;
  };
  return {
    register,
    registration,
    applyUpdate,
    needRefresh: () => act(() => onNeedRefresh?.()),
  };
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(resetDb);
afterEach(() => {
  updateService.reset();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const BANNER_TEXT = "新しいバージョンがあります";

describe("M-01 更新の案内", () => {
  it("新しい版を検知したら案内を表示し、「更新」で SC-01 に戻して切り替える", async () => {
    const sw = fakeRegister();
    updateService.start(sw.register);
    const { user } = renderApp({ path: "/settings" });
    expect(
      await screen.findByRole("heading", { name: "設定" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();

    sw.needRefresh();
    expect(screen.getByText(BANNER_TEXT)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "更新" }));
    expect(sw.applyUpdate).toHaveBeenCalledWith(true);
    // 再読み込み前に SC-01 に移動している
    expect(
      await screen.findByRole("heading", { name: "クローゼット" }),
    ).toBeInTheDocument();
  });

  it("SC-05 の表示中は出さず、閉じたあとに表示する", async () => {
    const sw = fakeRegister();
    updateService.start(sw.register);
    const { user } = renderApp({ path: "/items/new" });
    expect(await screen.findByText("アイテム登録")).toBeInTheDocument();
    sw.needRefresh();
    expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(await screen.findByText(BANNER_TEXT)).toBeInTheDocument();
  });

  it("×で閉じたら、次の確認（前面に戻り1時間以上経過）で再表示する", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T10:00:00"));
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const sw = fakeRegister();
    updateService.start(sw.register);
    const { user } = renderApp({ path: "/settings" });
    await screen.findByRole("heading", { name: "設定" });
    sw.needRefresh();

    await user.click(
      screen.getByRole("button", { name: "更新の案内を閉じる" }),
    );
    expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
    sw.registration.waiting = {} as ServiceWorker;

    // 1時間経っていなければ確認しない
    vi.setSystemTime(Date.now() + UPDATE_CHECK_INTERVAL_MS - 1000);
    act(() => setVisibility("visible"));
    expect(sw.registration.update).not.toHaveBeenCalled();
    expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();

    // 1時間以上経っていれば確認し、待機中の新しい版があれば再表示する
    vi.setSystemTime(Date.now() + 2000);
    act(() => setVisibility("visible"));
    await waitFor(() => expect(sw.registration.update).toHaveBeenCalled());
    expect(await screen.findByText(BANNER_TEXT)).toBeInTheDocument();
  });

  it("通信できない場合は確認しない", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const sw = fakeRegister();
    updateService.start(sw.register);
    vi.setSystemTime(Date.now() + UPDATE_CHECK_INTERVAL_MS + 1);
    setVisibility("visible");
    expect(sw.registration.update).not.toHaveBeenCalled();
  });
});
