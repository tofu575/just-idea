// 色成分が進行方向の境界へどの程度近いかを表す。
export enum ColorRiskLevel {
  // 境界まで十分な余裕がある。
  Safe = 'safe',
  // 境界が近づき、カード選択へ注意が必要である。
  Risk = 'risk',
  // 境界が近く、バーストへ特に注意が必要である。
  Danger = 'danger',
}

// 選択中ルールの色成分ごとの定性的な危険度を表示するモデル。
export type ColorRiskViewModel = Readonly<{
  channel: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y';
  level: ColorRiskLevel;
}>;
