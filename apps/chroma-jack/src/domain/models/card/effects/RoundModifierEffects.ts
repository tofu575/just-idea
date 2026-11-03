import {
  createHandEffectResult,
  CardEffectKind,
  type CardEffectContract,
  type CardEffectContext,
  type CardEffectResult,
} from './CardEffect';

// 未選択候補を捨てず、現在ラウンドで再利用できるようにする効果。
export class ContinueRoundEffect implements CardEffectContract {
  readonly kind = CardEffectKind.ContinueRound;
  // Handを変更せず、未選択候補を維持する指示を返す。
  applyTo(context: CardEffectContext): CardEffectResult {
    return {
      ...createHandEffectResult(context.hand, null, false),
      preserveUnselectedCards: true,
    };
  }
}

// 現在ラウンド中のRGB数値表示を解禁する効果。
export class RevealColorValuesEffect implements CardEffectContract {
  readonly kind = CardEffectKind.RevealColorValues;
  // Handを変更せず、数値表示解禁の指示を返す。
  applyTo(context: CardEffectContext): CardEffectResult {
    return {
      ...createHandEffectResult(context.hand, null, false),
      revealColorValues: true,
    };
  }
}

// 次にラウンド終了となるバーストを1回だけ防ぐ権利を与える効果。
export class PreventBurstEffect implements CardEffectContract {
  readonly kind = CardEffectKind.PreventBurst;
  // Handを変更せず、バースト防止権の付与を指示する。
  applyTo(context: CardEffectContext): CardEffectResult {
    return {
      ...createHandEffectResult(context.hand, null, false),
      grantBurstPrevention: true,
    };
  }
}
