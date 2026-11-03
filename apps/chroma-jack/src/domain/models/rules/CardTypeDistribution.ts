import { CardEffectKind } from '../card/effects/CardEffect';
import type { RandomGenerator } from '../../repositories/RandomGenerator';
import { IntegerRange } from '../shared/IntegerRange';

// カード種類ごとの相対的な出現率を表す設定値。
export type CardTypeWeights = Readonly<Record<CardEffectKind, number>>;

// 検証済みの出現率から山札へ入れるカード種類を選択するPolicy。
export class CardTypeDistribution {
  readonly weights: CardTypeWeights;
  private readonly enabledKinds: readonly CardEffectKind[];
  private readonly totalWeight: number;

  // 各種類の非負整数ウェイトを検証して保持する。
  constructor(weights: CardTypeWeights) {
    const entries = Object.entries(weights) as [CardEffectKind, number][];
    if (
      entries.some(
        ([, weight]) => !Number.isSafeInteger(weight) || weight < 0,
      ) ||
      entries.every(([, weight]) => weight === 0)
    ) {
      throw new RangeError(
        'Card type weights must be non-negative integers with a positive total.',
      );
    }
    const totalWeight = entries.reduce(
      (total, [, weight]) => total + weight,
      0,
    );
    if (!Number.isSafeInteger(totalWeight)) {
      throw new RangeError(
        'The total card type weight must be a safe integer.',
      );
    }
    this.weights = Object.freeze({ ...weights });
    this.enabledKinds = entries
      .filter(([, weight]) => weight > 0)
      .map(([kind]) => kind);
    this.totalWeight = totalWeight;
  }

  // ウェイトに従ってカード種類を1つ選択する。
  choose(random: RandomGenerator): CardEffectKind {
    if (this.enabledKinds.length === 1)
      return this.enabledKinds[0] as CardEffectKind;
    const range = IntegerRange.create(1, this.totalWeight);
    if (!(range instanceof IntegerRange))
      throw new RangeError(`Invalid card weight range: ${range}`);
    let roll = random.nextInteger(range);
    for (const kind of this.enabledKinds) {
      roll -= this.weights[kind];
      if (roll <= 0) return kind;
    }
    return this.enabledKinds.at(-1) as CardEffectKind;
  }

  // 通常加算カードだけが出現する分布を生成する。
  static addColorOnly(): CardTypeDistribution {
    return new CardTypeDistribution(createCardTypeWeights({ addColor: 100 }));
  }
}

// 未指定種類を0としてカード出現率一式を生成する。
export function createCardTypeWeights(
  weights: Partial<Record<CardEffectKind, number>>,
): CardTypeWeights {
  return {
    [CardEffectKind.AddColor]: weights[CardEffectKind.AddColor] ?? 0,
    [CardEffectKind.AdjustChannels]:
      weights[CardEffectKind.AdjustChannels] ?? 0,
    [CardEffectKind.SwapChannels]: weights[CardEffectKind.SwapChannels] ?? 0,
    [CardEffectKind.AdjustSaturation]:
      weights[CardEffectKind.AdjustSaturation] ?? 0,
    [CardEffectKind.AdjustBrightness]:
      weights[CardEffectKind.AdjustBrightness] ?? 0,
    [CardEffectKind.ContinueRound]: weights[CardEffectKind.ContinueRound] ?? 0,
    [CardEffectKind.RevealColorValues]:
      weights[CardEffectKind.RevealColorValues] ?? 0,
    [CardEffectKind.PreventBurst]: weights[CardEffectKind.PreventBurst] ?? 0,
  };
}
