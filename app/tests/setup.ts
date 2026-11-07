import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// Node の URL.createObjectURL は fake-indexeddb から取り出した Blob を扱えないため、
// テストでは常に固定の値を返す
URL.createObjectURL = () => "blob:test";
URL.revokeObjectURL = () => undefined;
