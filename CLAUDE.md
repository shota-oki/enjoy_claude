# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## リポジトリ概要

「洋服管理アプリ（仮称）」の開発リポジトリ。iPhone の Safari で使う PWA で、自分の洋服を写真付きで記録・一覧・絞り込みする。認証・サーバーはなく、データは端末内（IndexedDB）にのみ保存する。

ウォーターフォール型で進めており、要件定義〜設計はすべて合意済み。現在は実装フェーズ（アプリのソースコードは `app/` に作成予定、まだ未作成）。

## まず読むもの

- `docs/00_knowledge/合意事項・変更履歴.md` … 合意事項（K-xx）・変更経緯（C-xx）・文書作成ルール（R-xx）と成果物の所在の索引。作業前に必ず確認する
- `docs/01_requirements/要件定義書.md` … 要件定義書
- `docs/02_design/` … 基本設計（画面定義書・画面モック・方式設計書）、詳細設計（画面詳細設計書・処理設計書・DB設計書）
- `docs/03_test/テスト方針書.md` … テスト方針

## 技術構成（合意済み）

TypeScript + React + Vite / Dexie.js（IndexedDB）・dexie-react-hooks / vite-plugin-pwa / React Router（HashRouter）/ CSS Modules / Vitest + React Testing Library + fake-indexeddb。GitHub Pages に GitHub Actions で公開（版のタグ付け時）。

## 開発コマンド（`app/` で実行。方式設計書 M-02 で定義、実装時に作成）

| コマンド | 内容 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run dev:lan` | iPhone から HTTPS で接続できる開発サーバー起動 |
| `npm run build` / `npm run preview:lan` | 本番ビルド / ビルド結果を iPhone で確認（PWA・オフライン確認用） |
| `npm run test` | 単体・結合テスト |
| `npm run lint` / `npm run typecheck` / `npm run format` | ESLint / 型チェック / Prettier |
| `npm run seed:sample` | 確認用データ300件の作成 |

## 作業時のルール

- 不明点・判断が必要な点は作業を進める前に利用者へ確認する。自分で決めた仕様は各文書末尾の「確認事項」に書き、合意を得てから確定する
- 設計書は画面・処理・テーブル単位でファイルを分ける。図は `.drawio` を原本とし `.png` も併せて保存する
- 新たな合意・変更が発生したら `合意事項・変更履歴.md` にも追記する
- コーディング規約・ディレクトリ構成・ブランチ運用は方式設計書 M-02 と処理設計書 `00_共通.md` に従う
- コミットメッセージは日本語の1行要約
