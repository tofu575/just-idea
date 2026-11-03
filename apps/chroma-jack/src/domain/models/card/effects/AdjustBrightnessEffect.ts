import { Color } from '../../color/Color';
import {
  createHandEffectResult,
  CardEffectKind,
  type CardEffectContract,
  type CardEffectContext,
  type CardEffectResult,
} from './CardEffect';

// RGB全成分を同量動かして現在色の明度を操作するカード効果。
export class AdjustBrightnessEffect implements CardEffectContract {
  readonly kind = CardEffectKind.AdjustBrightness;
  // 明度へ加える符号付き整数を保持する。
  constructor(readonly amount: number) {
    if (!Number.isSafeInteger(amount) || amount === 0) {
      throw new RangeError('Brightness amount must be a non-zero integer.');
    }
  }

  // 各成分を0から255へ収めながら明度を変更する。
  applyTo(context: CardEffectContext): CardEffectResult {
    const color = Color.create(
      Math.min(255, Math.max(0, context.hand.color.red + this.amount)),
      Math.min(255, Math.max(0, context.hand.color.green + this.amount)),
      Math.min(255, Math.max(0, context.hand.color.blue + this.amount)),
    );
    if (!(color instanceof Color))
      throw new RangeError(`Invalid brightness color: ${color}`);
    const change = context.hand.changeColor(color, context.overflowPolicy);
    return createHandEffectResult(change.hand, null, false);
  }
}
