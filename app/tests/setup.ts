import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// jsdom には Blob の表示用URLがないため、テスト用の値を返す
if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => undefined;
}
