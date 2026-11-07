// 確認用データ（300件・写真付き）の作成。`npm run seed:sample` で起動したときだけ使う
// （テスト方針書：性能テスト用）。本番ビルドには含まれない
import { CATEGORIES, type CategoryId } from "../constants/categories";
import { COLORS } from "../constants/colors";
import { SEASONS, type SeasonId } from "../constants/seasons";
import { itemRepository } from "../repositories/itemRepository";
import { subcategoryRepository } from "../repositories/subcategoryRepository";
import { process } from "../services/imageProcessor";
import type { ItemInput, NewPhoto } from "../types/models";
import { logger } from "../utils/logger";

const SAMPLE_COUNT = 300;

const BRANDS = [
  "UNIQLO",
  "GU",
  "無印良品",
  "BEAMS",
  "URBAN RESEARCH",
  "nano・universe",
  "SHIPS",
  "ユナイテッドアローズ",
  "Levi's",
  "NIKE",
  "adidas",
  "patagonia",
];
const SIZES = ["S", "M", "L", "XL", "FREE", "26cm", "27cm"];
const SHOPS = ["公式オンラインストア", "駅前店", "アウトレット", "百貨店"];
const MATERIALS = ["綿100%", "ポリエステル100%", "ウール80% ナイロン20%"];
const WASHING = ["洗濯機可", "手洗い", "ドライクリーニング"];

/** 毎回同じデータになるよう、乱数は種を固定する */
function createRandom(seed: number) {
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return {
    next,
    pick: <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)]!,
    chance: (p: number) => next() < p,
  };
}

/** 色と番号を描いた写真を作り、登録時と同じ処理（P-04）で縮小・サムネイル化する */
async function makePhoto(
  label: string,
  icon: string,
  color: string,
  index: number,
): Promise<NewPhoto> {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 960;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color.startsWith("#") ? color : "#B0B0B5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(140, 180, 1000, 600);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1c1c1e";
  ctx.font = "220px sans-serif";
  ctx.fillText(icon, 640, 470);
  ctx.font = "bold 72px sans-serif";
  ctx.fillText(`${label}（${index}枚目）`, 640, 640);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.8,
    ),
  );
  return process(blob);
}

/**
 * アイテムが1件もないときだけ、300件を作る。既にアイテムがある場合は何もしない
 * （作り直すときは Safari の Webサイトデータを削除してから開き直す）
 */
export async function seedSampleData(
  onProgress: (text: string) => void,
): Promise<void> {
  if ((await itemRepository.count()) > 0) {
    logger.info("アイテムが登録済みのため、確認用データは作成しません");
    return;
  }
  const random = createRandom(20261107);
  const subcategories = await subcategoryRepository.listAll();
  const start = performance.now();

  for (let i = 1; i <= SAMPLE_COUNT; i += 1) {
    onProgress(`確認用データを作成しています… ${i} / ${SAMPLE_COUNT}`);
    const category = random.pick(CATEGORIES);
    const categoryId: CategoryId = category.id;
    const subs = subcategories.filter((s) => s.categoryId === categoryId);
    const subcategory =
      subs.length > 0 && random.chance(0.85) ? random.pick(subs) : null;
    const color = random.pick(COLORS);
    const seasons: SeasonId[] = SEASONS.filter(() => random.chance(0.5)).map(
      (s) => s.id,
    );
    const name = `${subcategory?.name ?? category.name} ${i}`;
    const month = String(1 + Math.floor(random.next() * 12)).padStart(2, "0");
    const year = 2018 + Math.floor(random.next() * 8);

    const input: ItemInput = {
      name,
      categoryId,
      subcategoryId: subcategory?.id ?? null,
      colorId: color.id,
      brand: random.chance(0.8) ? random.pick(BRANDS) : null,
      size: random.chance(0.7) ? random.pick(SIZES) : null,
      purchaseDate: random.chance(0.6) ? `${year}-${month}-15` : null,
      price: random.chance(0.6)
        ? Math.round(random.next() * 300) * 100 + 990
        : null,
      shop: random.chance(0.4) ? random.pick(SHOPS) : null,
      seasons,
      material: random.chance(0.3) ? random.pick(MATERIALS) : null,
      washingMethod: random.chance(0.3) ? random.pick(WASHING) : null,
      memo: random.chance(0.2) ? "確認用データ" : null,
    };
    // 10件に1件は写真を3枚、それ以外は1枚
    const photoCount = i % 10 === 0 ? 3 : 1;
    const photos: NewPhoto[] = [];
    for (let p = 1; p <= photoCount; p += 1) {
      photos.push(await makePhoto(name, category.icon, color.swatch, p));
    }
    await itemRepository.create(input, photos);
  }
  logger.info(
    `確認用データを${SAMPLE_COUNT}件作成しました（${Math.round(performance.now() - start)}ms）`,
  );
}
