# Chroma Jack

画面に現れる色だけを頼りに、現在の色を白へ近づける1人用スコアアタックです。公開された候補から加える色を選ぶか、候補をすべて捨てるか、ちょうどよいところで止めます。いずれかの色成分を加えすぎるとバーストし、そのラウンドは0点になります。

## 使用技術

- React / TypeScript
- Vite
- MUI（Material UI）
- i18next / react-i18next
- Vitest / React Testing Library
- ESLint / Prettier

## 起動方法

Node.js 20 と npm を使用します。

```bash
npm install
npm run dev
```

ターミナルに表示されるローカルURL（通常は `http://localhost:5173`）をブラウザで開いてください。

## テスト・品質チェック

```bash
npm run test
npm run lint
npm run format:check
npm run build
```

## GitHub Pagesへの公開

`.github/workflows/deploy-pages.yml` がPull Requestで品質チェックを実行し、`main`へのpushまたは手動実行でビルド結果をGitHub Pagesへ公開します。Pagesが返すベースパスをViteへ渡すため、リポジトリ配下のURLとカスタムドメインのどちらでもアセットの参照先が自動調整されます。

初回のみ、GitHubのリポジトリ画面で次の設定を行ってください。

1. `Settings` → `Pages` を開く
2. `Build and deployment` の `Source` を `GitHub Actions` にする
3. `main`へマージするか、`Actions`から`Test and deploy GitHub Pages`を手動実行する

公開URLはWorkflowの`deploy`ジョブと、リポジトリの`Settings` → `Pages`に表示されます。

## アーキテクチャ

依存方向を表示からルール側へ向けた、小規模なレイヤー構成です。

- `src/domain/models/color`: 上限を持たない非負整数の色Value Object
- `src/domain/models/card`: 識別子と効果を持つゲームカード、および効果固有の値と振る舞い
- `src/domain/models/game`: ゲーム状態、ラウンド内のカード適用と進行、ラウンド結果
- `src/domain/models/hand`: 色の加算・バースト判定・スコア計算に使う手札モデル
- `src/domain/models/game`: ゲーム進行、ラウンド結果、ゲーム設定
- `src/domain/models/rules`: 色生成傾向、許容バースト色数、スコアのPolicy
- `src/domain/models/shared`: 検証済み整数範囲などの共有Value Object
- `src/domain/repositories`: Domainが要求する外部依存のインターフェース
- `src/domain/usecases`: 開始・加算・破棄・停止・次ラウンドのユースケース
- `src/gateway/repositories`: ブラウザ乱数生成器
- `src/gateway/api/generated`: 将来のAPI生成物の配置先（現在は通信機能なし）
- `src/presentation/pages`: タイトル・ゲーム・最終結果画面
- `src/presentation/providers`: MUIテーマとゲーム状態を接続するフック
- `src/presentation/i18n`: JSON辞書と日本語・英語の表示切り替え
- `src/presentation/mappers`: Domain Modelから表示用モデルへの変換
- `src/presentation/models`: UIが描画するカードの色・模様・翻訳キー
- `src/presentation/rules`: ルール本体と表示用翻訳キーの関連付け
- `src/presentation/router`: アプリケーション状態に基づく画面切り替え
- `src/presentation/widgets`: 再利用可能な表示・操作部品

ゲームロジックはReactやブラウザAPIに依存しません。値の検証とビジネスルールは責任を持つDomain Modelへ集約しています。想定内の生成失敗やゲーム結果は独自Errorではなくenumで表現します。`GameEngine`はゲーム開始時に注入された`GameRules`と乱数生成器を保持するため、ゲーム途中でルールが変わりません。初期色範囲、色生成傾向、カード種類ごとの出現率、許容バースト色数、スコア計算を個別に差し替えられます。

### ルールの差し替え

開始画面のコンボボックスでは`GameRules.classic()`がデフォルトです。1色までのバースト成分を255に固定して続行する`Clamp Challenge`と、特殊カードを試せる`Special Deck`も選択できます。ルールはComposition Rootから次のように初期選択として注入できます。

```tsx
<AppRouter initialRules={GameRules.clampChallenge()} />
```

独自ルールでは`GameRules`へ検証済みの色範囲、`ColorGenerationPolicy`、`CardTypeDistribution`、`OverflowPolicy`、`ScorePolicy`を渡します。カード種類の出現率は非負整数の相対ウェイトで指定します。`OverflowPolicy`は継続を許す累計バースト色数を0〜2で指定し、3色すべてのバースト継続は許可しません。渡されたルールが表示中に変更されても進行中のゲームには適用せず、次にゲームを開始した時点で採用します。

## 実装済み機能

- ランダムな初期色と、ルールごとに指定できる山札・同時公開枚数による全5ラウンド
- 候補色のクリックによる即時加算、候補をすべて捨てる、現在色で止める操作
- RGB増減、成分交換、彩度・明度操作の特殊カード
- 未選択候補の維持、ラウンド中の数値表示解禁、1回限りのバースト防止カード
- ルールごとに変更できるカード種類の出現率
- 色成分の上限超過によるバースト
- 外部注入できるゲームルールと、許容色数まで255固定で続行するチャレンジルール
- ゲーム開始前のルール選択と、続行可能なバースト色数のプレイ中表示
- JSON辞書を使った日本語・英語表示の切り替え
- 白への距離に基づくラウンドスコアと最終スコア
- ラウンド結果、全ラウンドのスコア一覧
- もう一度遊ぶ、タイトルへ戻る操作
- 約320px幅から使えるレスポンシブ表示
- ゲームルールと主要画面遷移の自動テスト

## 設計上の意図

このゲームは数値計算ではなく色彩感覚を試すため、通常はカードを判断している間にRGB値、カラーコード、予測値を表示しません。数値表示カードを使ったラウンドに限り現在のRGB値を解禁します。バースト継続ルールでは状態を理解できるよう累計バースト色数のみを表示しますが、色成分名や残り許容量は表示しません。ラウンド終了後は、判断を振り返れるよう確定色またはバーストを起こした加算後のRGB値を表示します。通信処理はなく、ゲームは完全にブラウザ内で動作します。

## 未実装のTODO

仕様書のTODOにある対戦、ランキング、保存、音、詳細チュートリアル、ダークモード、バックエンドなどは、このプロトタイプでは実装していません。詳細は [`docs/cocept.md`](docs/cocept.md) を参照してください。
