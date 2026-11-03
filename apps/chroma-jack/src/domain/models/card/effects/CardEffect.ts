import type { Hand } from '../../hand/Hand';
import type { OverflowPolicy } from '../../rules/OverflowPolicy';
import type { AddColorEffect } from './AddColorEffect';
import type { AdjustBrightnessEffect } from './AdjustBrightnessEffect';
import type { AdjustColorEffect } from './AdjustColorEffect';
import type { AdjustSaturationEffect } from './AdjustSaturationEffect';
import type {
  ContinueRoundEffect,
  PreventBurstEffect,
  RevealColorValuesEffect,
} from './RoundModifierEffects';
import type { SwapColorChannelsEffect } from './SwapColorChannelsEffect';

// カード効果の種類を示し、実行処理と表示変換の判別子として使用する。
export enum CardEffectKind {
  // RGB値を加算する通常効果。
  AddColor = 'addColor',
  // RGBの一部を増減する効果。
  AdjustChannels = 'adjustChannels',
  // 2つのRGB成分を交換する効果。
  SwapChannels = 'swapChannels',
  // 彩度を操作する効果。
  AdjustSaturation = 'adjustSaturation',
  // 明度を操作する効果。
  AdjustBrightness = 'adjustBrightness',
  // 未選択候補を維持する効果。
  ContinueRound = 'continueRound',
  // 現在ラウンドのRGB数値表示を解禁する効果。
  RevealColorValues = 'revealColorValues',
  // 次の終了バーストを1回防止する効果。
  PreventBurst = 'preventBurst',
}

// カード効果を適用する時点のラウンド情報。
export type CardEffectContext = Readonly<{
  hand: Hand;
  overflowPolicy: OverflowPolicy;
  canPreventBurst: boolean;
}>;

// カード効果がHandとラウンド進行へ与えた変更を示す。
export type CardEffectResult = Readonly<{
  hand: Hand;
  burstHand: Hand | null;
  usedBurstPrevention: boolean;
  revealColorValues: boolean;
  grantBurstPrevention: boolean;
  preserveUnselectedCards: boolean;
}>;

// すべてのカード効果が実装する実行契約。
export interface CardEffectContract {
  readonly kind: CardEffectKind;
  applyTo(context: CardEffectContext): CardEffectResult;
}

// 実装済みカード効果をkindで型安全に判別できるUnion。
export type CardEffect =
  | AddColorEffect
  | AdjustColorEffect
  | SwapColorChannelsEffect
  | AdjustSaturationEffect
  | AdjustBrightnessEffect
  | ContinueRoundEffect
  | RevealColorValuesEffect
  | PreventBurstEffect;

// Handの変更結果を標準的なカード効果結果へ変換する。
export function createHandEffectResult(
  nextHand: Hand,
  burstHand: Hand | null,
  usedBurstPrevention: boolean,
): CardEffectResult {
  return {
    hand: nextHand,
    burstHand,
    usedBurstPrevention,
    revealColorValues: false,
    grantBurstPrevention: false,
    preserveUnselectedCards: false,
  };
}
