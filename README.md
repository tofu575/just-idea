# Just Idea

思いついたアイデアを、それぞれ独立したWebアプリとして実現するリポジトリです。

| アプリ                 | 概要                             | 開発手順                                         |
| ---------------------- | -------------------------------- | ------------------------------------------------ |
| Chroma Jack            | 色の判断で白を目指すゲーム       | [apps/chroma-jack](apps/chroma-jack/README.md)   |
| 文字風化シミュレーター | 輪郭から文字が風化する過程を観察 | [apps/text-erosion](apps/text-erosion/README.md) |
| Rain on Glass | 雨の窓で水滴の成長・合体・滑落を眺める | [apps/rain-on-glass](apps/rain-on-glass/README.md) |

## 開発

Node.js 20 と npm を使用します。各アプリの依存関係・設定・テストはアプリ内で管理します。

```bash
cd apps/chroma-jack
npm ci
npm run dev
```

新しいアイデアは `apps/<app-name>` に追加し、そのディレクトリにREADMEと実行手順を用意してください。アプリ固有の設計ルールは各アプリの `AGENTS.md` に記載します。追加時はルートの `index.html` のリンク、このREADMEのアプリ一覧・公開先、公開CIの依存関係インストール・検証・ベースパス付きビルド・配信ディレクトリへのコピーも更新してください。

## GitHub Pagesへの公開

`.github/workflows/deploy-pages.yml` が全アプリのテスト・ビルドと、Chroma Jackのlint・フォーマットチェックを実行します。PRでは検証のみ行い、`main`へのpushまたは`main`での手動実行で、全アプリを1つのPagesサイトとして公開します。

| アプリ | 公開先 |
| --- | --- |
| アプリ一覧 | https://tofu575.github.io/just-idea/ |
| Chroma Jack | https://tofu575.github.io/just-idea/chroma-jack/ |
| 文字風化シミュレーター | https://tofu575.github.io/just-idea/text-erosion/ |
| Rain on Glass | https://tofu575.github.io/just-idea/rain-on-glass/ |

ルートの `index.html` を配信ルートに、各アプリのビルドを `chroma-jack/`、`text-erosion/`、`rain-on-glass/` に配置します。従来のChroma JackのURLはアプリ一覧になります。全アプリの検証が成功した場合だけ公開するため、アプリ単独のデプロイでほかのアプリが消えることはありません。ベースパスはGitHub Pagesの設定から取得し、カスタムドメインでも同じ構成で配信します。リポジトリの `Settings` → `Pages` → `Source` は `GitHub Actions` に設定してください。
