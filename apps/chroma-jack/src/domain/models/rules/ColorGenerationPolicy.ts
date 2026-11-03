import type { RandomGenerator } from '../../repositories/RandomGenerator';
import type { IntegerRange } from '../shared/IntegerRange';

// 範囲内の乱数をどちら側へ偏らせるかを示す。
export enum ColorGenerationTrend {
  // 一様な乱数をそのまま使用する。
  Uniform = 'uniform',
  // 2回の抽選から小さい値を採用する。
  Lower = 'lower',
  // 2回の抽選から大きい値を採用する。
  Higher = 'higher',
}

// 乱数を色成分へ変換するときの生成傾向を表すPolicy。
export class ColorGenerationPolicy {
  // 色成分の生成時に使用する偏りを固定する。
  constructor(readonly trend: ColorGenerationTrend) {}

  // 設定された傾向に従って範囲内の色成分を生成する。
  generateChannel(range: IntegerRange, random: RandomGenerator): number {
    const first = random.nextInteger(range);
    if (this.trend === ColorGenerationTrend.Uniform) return first;

    const second = random.nextInteger(range);
    return this.trend === ColorGenerationTrend.Higher
      ? Math.max(first, second)
      : Math.min(first, second);
  }
}
