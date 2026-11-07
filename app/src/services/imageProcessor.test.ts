import { ImageLoadError, process } from "./imageProcessor";

// jsdom には画像の読み込み・canvas の描画がないため、ブラウザの機能を差し替えて確認する
function mockBrowser(width: number, height: number) {
  const draws: unknown[][] = [];
  const canvases: { width: number; height: number }[] = [];
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width, height, close: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement) {
      canvases.push({ width: this.width, height: this.height });
      return {
        drawImage: (...args: unknown[]) => draws.push(args),
        imageSmoothingQuality: "low",
      } as unknown as CanvasRenderingContext2D;
    } as unknown as HTMLCanvasElement["getContext"],
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
    type,
    quality,
  ) {
    expect(type).toBe("image/jpeg");
    expect(quality).toBe(0.8);
    callback(new Blob([new Uint8Array(this.width)], { type }));
  });
  return { draws, canvases };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("imageProcessor.process", () => {
  it("長辺1280pxに縮小し、400pxの正方形の一覧用画像を作る", async () => {
    const { draws, canvases } = mockBrowser(4032, 3024);
    const result = await process(new Blob());
    expect(result).toMatchObject({ width: 1280, height: 960 });
    expect(result.byteSize).toBe(result.image.size);
    expect(result.thumbnailByteSize).toBe(result.thumbnail.size);
    expect(canvases).toEqual([
      { width: 1280, height: 960 },
      { width: 400, height: 400 },
    ]);
    // 中央の正方形（横長なら左右を切る）を切り抜く
    expect(draws[1].slice(1)).toEqual([504, 0, 3024, 3024, 0, 0, 400, 400]);
  });

  it("長辺1280px以下は拡大しない", async () => {
    mockBrowser(600, 800);
    const result = await process(new Blob());
    expect(result).toMatchObject({ width: 600, height: 800 });
  });

  it("読み込めない場合は ImageLoadError", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode");
      }),
    );
    // jsdom の <img> には decode がないため追加する
    HTMLImageElement.prototype.decode = vi.fn(async () => {
      throw new Error("decode");
    });
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    await expect(process(new Blob())).rejects.toBeInstanceOf(ImageLoadError);
  });
});
