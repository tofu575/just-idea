import { Color } from '../../color/Color';
import {
  createHandEffectResult,
  CardEffectKind,
  type CardEffectContract,
  type CardEffectContext,
  type CardEffectResult,
} from './CardEffect';

// RGBの平均値を保ちながら成分差を拡縮し、彩度を操作するカード効果。
export class AdjustSaturationEffect implements CardEffectContract {
  readonly kind = CardEffectKind.AdjustSaturation;
  // 100を基準とする正の彩度倍率を保持する。
  constructor(readonly percentage: number) {
    if (
      !Number.isSafeInteger(percentage) ||
      percentage <= 0 ||
      percentage === 100
    ) {
      throw new RangeError(
        'Saturation percentage must be a positive integer other than 100.',
      );
    }
  }

  // RGB平均からの距離を倍率で変え、表示可能範囲へ収める。
  applyTo(context: CardEffectContext): CardEffectResult {
    const source = context.hand.color;
    const average = (source.red + source.green + source.blue) / 3;
    const adjust = (channel: number) =>
      Math.min(
        255,
        Math.max(
          0,
          Math.round(average + ((channel - average) * this.percentage) / 100),
        ),
      );
    const color = Color.create(
      adjust(source.red),
      adjust(source.green),
      adjust(source.blue),
    );
    if (!(color instanceof Color))
      throw new RangeError(`Invalid saturation color: ${color}`);
    const change = context.hand.changeColor(color, context.overflowPolicy);
    return createHandEffectResult(change.hand, null, false);
  }
}
