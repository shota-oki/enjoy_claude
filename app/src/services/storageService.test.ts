import { isPersisted, isStandalone, requestPersist } from "./storageService";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("storageService", () => {
  it("永続保存の機能に未対応なら false（未許可）", async () => {
    vi.stubGlobal("navigator", {});
    expect(await requestPersist()).toBe(false);
    expect(await isPersisted()).toBe(false);
  });

  it("永続保存の要求・状態を返す", async () => {
    vi.stubGlobal("navigator", {
      storage: { persist: async () => true, persisted: async () => true },
    });
    expect(await requestPersist()).toBe(true);
    expect(await isPersisted()).toBe(true);
  });

  it("ホーム画面からの起動を判定する", () => {
    vi.stubGlobal("navigator", { standalone: true });
    expect(isStandalone()).toBe(true);

    vi.stubGlobal("navigator", {});
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(isStandalone()).toBe(true);

    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    expect(isStandalone()).toBe(false);
  });
});
