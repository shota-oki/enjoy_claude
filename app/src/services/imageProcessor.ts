import {
  JPEG_QUALITY,
  PHOTO_MAX_EDGE,
  THUMBNAIL_SIZE,
} from "../constants/limits";
import type { NewPhoto } from "../types/models";

/** 写真を読み込めない・変換できない（P-04） */
export class ImageLoadError extends Error {
  constructor(cause?: unknown) {
    super("image load failed", { cause });
    this.name = "ImageLoadError";
  }
}

type Source = {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

/** 撮影時の向きを反映して読み込む */
async function load(file: Blob): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // 対応していない形式などは <img> での読み込みを試す
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return {
      image: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => undefined,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

/**
 * 写真1枚を保存用（長辺1280px以下）と一覧用（400px正方形）の JPEG に変換する（P-04 3.3）。
 * 描き直すことで位置情報などの付加情報は引き継がれない（M-04 2.2）
 */
export async function process(file: Blob): Promise<NewPhoto> {
  let source: Source | undefined;
  try {
    source = await load(file);
    const { width: w, height: h } = source;
    if (w === 0 || h === 0) throw new Error("empty image");

    // 長辺1280pxを超える場合のみ縮小する（拡大はしない）
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(w, h));
    const width = Math.round(w * scale);
    const height = Math.round(h * scale);
    const photoCanvas = createCanvas(width, height);
    context(photoCanvas).drawImage(source.image, 0, 0, width, height);
    const image = await toJpeg(photoCanvas);

    // 中央を正方形に切り抜いて400pxにする
    const side = Math.min(w, h);
    const thumbCanvas = createCanvas(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    context(thumbCanvas).drawImage(
      source.image,
      (w - side) / 2,
      (h - side) / 2,
      side,
      side,
      0,
      0,
      THUMBNAIL_SIZE,
      THUMBNAIL_SIZE,
    );
    const thumbnail = await toJpeg(thumbCanvas);

    return {
      image,
      thumbnail,
      width,
      height,
      byteSize: image.size,
      thumbnailByteSize: thumbnail.size,
    };
  } catch (error) {
    throw new ImageLoadError(error);
  } finally {
    source?.close();
  }
}
