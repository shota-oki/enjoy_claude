/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

// 公開先のパス（GitHub Pages では /enjoy_claude/）。ビルド時に BASE_PATH で指定する（M-03）
const base = process.env.BASE_PATH ?? "/";

// コンテンツセキュリティポリシー（M-04 2.3）。開発サーバーは再読み込み用の
// インラインスクリプトを使うため、本番ビルドのときだけ meta タグで設定する
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "img-src 'self' blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
].join("; ");

const cspPlugin: Plugin = {
  name: "closet-csp",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "meta",
      attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
      injectTo: "head-prepend",
    },
  ],
};

export default defineConfig(({ mode }) => ({
  base,
  define: {
    // SC-06 に表示するバージョン（P-10）
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    cspPlugin,
    // iPhone 実機確認用に HTTPS で公開する（M-02 5章）
    ...(mode === "lan" ? [basicSsl()] : []),
    VitePWA({
      // 新しい版は利用者が「更新」を押したときに切り替える（M-01 4章）
      registerType: "prompt",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "洋服管理",
        short_name: "クローゼット",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        theme_color: "#2B5F8E",
        background_color: "#F2F2F7",
        lang: "ja",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // アプリ本体のみを事前キャッシュする（M-01 3章）
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/services/**",
        "src/repositories/**",
        "src/utils/**",
        "src/db/**",
      ],
    },
  },
}));
