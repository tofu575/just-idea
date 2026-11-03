import { Color } from '../../color/Color';
import { HandAdditionStatus } from '../../hand/Hand';
import {
  createHandEffectResult,
  CardEffectKind,
  type CardEffectContract,
  type CardEffectContext,
  type CardEffectResult,
} from './CardEffect';

// RGB成分ごとの増減量を現在色へ反映するカード効果。
export class AdjustColorEffect implements CardEffectContract {
  readonly kind = CardEffectKind.AdjustChannels;
  readonly delta: Readonly<{ red: number; green: number; blue: number }>;

  // RGB成分ごとの符号付き変更量を保持する。
  constructor(delta: Readonly<{ red: number; green: number; blue: number }>) {
    const changes = [delta.red, delta.green, delta.blue];
    if (
      changes.some((change) => !Number.isSafeInteger(change)) ||
      changes.every((change) => change === 0)
    ) {
      throw new RangeError(
        'Color adjustment must contain a non-zero integer change.',
      );
    }
    this.delta = Object.freeze({
      red: delta.red,
      green: delta.green,
      blue: delta.blue,
    });
  }

  // 各成分を0未満にしないよう変更し、上限超過ルールを適用する。
  applyTo(context: CardEffectContext): CardEffectResult {
    const color = Color.create(
      Math.max(0, context.hand.color.red + this.delta.red),
      Math.max(0, context.hand.color.green + this.delta.green),
      Math.max(0, context.hand.color.blue + this.delta.blue),
    );
    if (!(color instanceof Color))
      throw new RangeError(`Invalid adjusted color: ${color}`);
    const change = context.hand.changeColor(color, context.overflowPolicy);
    if (change.status === HandAdditionStatus.Burst && context.canPreventBurst) {
      const prevented = context.hand.changeColor(
        color,
        context.overflowPolicy,
        true,
      );
      return createHandEffectResult(prevented.hand, null, true);
    }
    return createHandEffectResult(
      change.status === HandAdditionStatus.Burst ? context.hand : change.hand,
      change.status === HandAdditionStatus.Burst ? change.hand : null,
      false,
    );
  }
}
