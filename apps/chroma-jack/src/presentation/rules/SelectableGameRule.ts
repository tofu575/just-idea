import type { GameRules } from '../../domain/models/rules/GameRules';

// ゲームルールと、選択UIで使用する翻訳キーを関連付ける。
export type SelectableGameRule = Readonly<{
  rules: GameRules;
  labelKey: string;
  descriptionKey: string;
}>;

// 組み込みルールをアプリ全体で利用できる選択肢へ変換する。
export function createBuiltInRuleOptions(args: {
  classic: GameRules;
  clampChallenge: GameRules;
  specialDeck: GameRules;
}): readonly SelectableGameRule[] {
  return [
    {
      rules: args.classic,
      labelKey: 'rules.classic.label',
      descriptionKey: 'rules.classic.description',
    },
    {
      rules: args.clampChallenge,
      labelKey: 'rules.clampChallenge.label',
      descriptionKey: 'rules.clampChallenge.description',
    },
    {
      rules: args.specialDeck,
      labelKey: 'rules.specialDeck.label',
      descriptionKey: 'rules.specialDeck.description',
    },
  ];
}
