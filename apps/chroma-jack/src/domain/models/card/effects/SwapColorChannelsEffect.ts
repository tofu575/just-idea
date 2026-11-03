import { Color } from '../../color/Color';
import type { ColorChannel } from '../../color/ColorChannel';
import {
  createHandEffectResult,
  CardEffectKind,
  type CardEffectContract,
  type CardEffectContext,
  type CardEffectResult,
} from './CardEffect';

// 現在色の2つのRGB成分を交換するカード効果。
export class SwapColorChannelsEffect implements CardEffectContract {
  readonly kind = CardEffectKind.SwapChannels;
  // 交換対象となる異なる2成分を保持する。
  constructor(
    readonly first: ColorChannel,
    readonly second: ColorChannel,
  ) {
    if (first === second)
      throw new RangeError('Swap channels must be different.');
  }

  // 指定した2成分だけを交換し、クランプ履歴を維持する。
  applyTo(context: CardEffectContext): CardEffectResult {
    const values = {
      red: context.hand.color.red,
      green: context.hand.color.green,
      blue: context.hand.color.blue,
    };
    [values[this.first], values[this.second]] = [
      values[this.second],
      values[this.first],
    ];
    const color = Color.create(values.red, values.green, values.blue);
    if (!(color instanceof Color))
      throw new RangeError(`Invalid swapped color: ${color}`);
    const change = context.hand.changeColor(color, context.overflowPolicy);
    return createHandEffectResult(change.hand, null, false);
  }
}
