// ホーム画面のアイコン（M-01 2.1）を public/ に作る。`npm run icons` で実行する。
// 意匠：アクセントカラー（#2B5F8E）の背景に、タブバーと同じハンガーの線画を白で描く。
// 外部ライブラリを使わず、線からの距離で塗る簡易な描画と PNG 出力を行う。
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BACKGROUND = [0x2b, 0x5f, 0x8e];
const LINE = [0xff, 0xff, 0xff];
const STROKE = 1.6; // 線の太さ（24×24 のアイコン座標での値）

/** ハンガーの形（Icon.tsx の hanger と同じ形を折れ線で表したもの。24×24 座標） */
function hangerPolylines() {
  const hook = [
    [12, 8.5],
    [12, 8],
  ];
  // 首の曲線（3次ベジェ曲線）
  const b = [
    [12, 8],
    [12, 6.8],
    [14, 6.4],
    [14, 4.8],
  ];
  for (let i = 1; i <= 16; i += 1) {
    const t = i / 16;
    const u = 1 - t;
    hook.push([
      u ** 3 * b[0][0] +
        3 * u * u * t * b[1][0] +
        3 * u * t * t * b[2][0] +
        t ** 3 * b[3][0],
      u ** 3 * b[0][1] +
        3 * u * u * t * b[1][1] +
        3 * u * t * t * b[2][1] +
        t ** 3 * b[3][1],
    ]);
  }
  // 上部の半円（中心 12,4.8・半径2）
  for (let i = 1; i <= 24; i += 1) {
    const a = (-Math.PI * i) / 24;
    hook.push([12 + 2 * Math.cos(a), 4.8 + 2 * Math.sin(a)]);
  }
  const body = [
    [12, 8.5],
    [3.2, 15.6],
    [3.8, 17.5],
    [20.2, 17.5],
    [20.8, 15.6],
    [12, 8.5],
  ];
  return [hook, body];
}

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function render(size) {
  // ハンガーの幅（17.6）がアイコンの約6割になるよう拡大し、中央に置く
  const scale = (size * 0.6) / 17.6;
  const offsetX = size / 2 - 12 * scale;
  const offsetY = size / 2 - 10.15 * scale;
  const segments = hangerPolylines().flatMap((line) =>
    line.slice(1).map((p, i) => [
      [line[i][0] * scale + offsetX, line[i][1] * scale + offsetY],
      [p[0] * scale + offsetX, p[1] * scale + offsetY],
    ]),
  );
  const half = (STROKE * scale) / 2;
  const pixels = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 3 + 1);
    pixels[row] = 0; // フィルタなし
    for (let x = 0; x < size; x += 1) {
      let d = Infinity;
      for (const [a, b] of segments)
        d = Math.min(d, distanceToSegment(x + 0.5, y + 0.5, a, b));
      // 線の縁は1ピクセル分なめらかにする
      const alpha = Math.max(0, Math.min(1, half - d + 0.5));
      for (let c = 0; c < 3; c += 1) {
        pixels[row + 1 + x * 3 + c] = Math.round(
          BACKGROUND[c] * (1 - alpha) + LINE[c] * alpha,
        );
      }
    }
  }
  return encodePng(size, pixels);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // ビット深度
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outputs = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];
for (const [name, size] of outputs) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), render(size));
  console.log(`public/${name}（${size}×${size}）を作成しました`);
}
