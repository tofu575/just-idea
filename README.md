# Just Idea

思いついたアイデアを、それぞれ独立したWebアプリとして実現するリポジトリです。

| アプリ | 概要 | 開発手順 |
| --- | --- | --- |
| Chroma Jack | 色の判断で白を目指すゲーム | [apps/chroma-jack](apps/chroma-jack/README.md) |

## 開発

Node.js 20 と npm を使用します。各アプリの依存関係・設定・テストはアプリ内で管理します。

```bash
cd apps/chroma-jack
npm ci
npm run dev
```

新しいアイデアは `apps/<app-name>` に追加し、そのディレクトリにREADMEと実行手順を用意してください。アプリ固有の設計ルールは各アプリの `AGENTS.md` に記載します。

Chroma JackのGitHub Pages公開先は従来どおりです。CIはアプリのディレクトリから実行します。スタックしたPRでも品質チェックを実行し、公開は `main` のみで行います。
