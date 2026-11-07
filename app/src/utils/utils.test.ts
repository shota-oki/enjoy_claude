import { compareName } from "./compare";
import {
  formatByteSize,
  formatCount,
  formatDateString,
  formatPrice,
  formatTimestamp,
  toDateString,
} from "./format";
import { toHalfWidthDigits, toNullableText, trimText } from "./text";
import { msg } from "../constants/messages";

describe("format", () => {
  it("日付を YYYY/MM/DD にする", () => {
    expect(formatDateString("2026-05-10")).toBe("2026/05/10");
    expect(formatTimestamp(new Date(2026, 5, 1, 23, 59).getTime())).toBe(
      "2026/06/01",
    );
    expect(toDateString(new Date(2026, 0, 2))).toBe("2026-01-02");
  });

  it("金額を ¥＋3桁区切りにする（0円は ¥0）", () => {
    expect(formatPrice(12100)).toBe("¥12,100");
    expect(formatPrice(0)).toBe("¥0");
    expect(formatPrice(9999999)).toBe("¥9,999,999");
  });

  it("件数に「点」を付ける", () => {
    expect(formatCount(16)).toBe("16点");
  });

  it("容量を 1MB未満／MB／GB で表示する", () => {
    const MB = 1024 * 1024;
    expect(formatByteSize(0)).toBe("1MB未満");
    expect(formatByteSize(MB - 1)).toBe("1MB未満");
    expect(formatByteSize(MB)).toBe("約1.0MB");
    expect(formatByteSize(32.4 * MB)).toBe("約32.4MB");
    expect(formatByteSize(1024 * MB - 1)).toBe("約1024.0MB");
    expect(formatByteSize(1024 * MB)).toBe("約1.0GB");
    expect(formatByteSize(1.2 * 1024 * MB)).toBe("約1.2GB");
  });
});

describe("text", () => {
  it("前後の半角・全角空白を取り除く", () => {
    expect(trimText(" 　白T　 ")).toBe("白T");
    expect(trimText("白 T")).toBe("白 T");
  });

  it("空白のみは null にする", () => {
    expect(toNullableText("　 ")).toBeNull();
    expect(toNullableText(" a ")).toBe("a");
  });

  it("全角数字を半角にする", () => {
    expect(toHalfWidthDigits("１２３4")).toBe("1234");
  });
});

describe("compareName", () => {
  it("五十音順で、英字で始まるものは日本語の後", () => {
    const names = ["Tシャツ", "うわぎ", "あお", "シャツ", "Apple", "ｂｅｔａ"];
    expect([...names].sort(compareName)).toEqual([
      "あお",
      "うわぎ",
      "シャツ",
      "Apple",
      "ｂｅｔａ",
      "Tシャツ",
    ]);
  });
});

describe("msg", () => {
  it("差し込み項目を置き換える", () => {
    expect(msg("MSG-E09", { n: 3 })).toBe(
      "写真は最大10枚までです。先頭から3枚を追加しました",
    );
    expect(msg("MSG-C12", { name: "デニム", n: 2 })).toContain(
      "「デニム」には2点",
    );
  });
});
