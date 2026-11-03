import { Hand } from '../hand/Hand';

// 白への距離とクランプ履歴からラウンドスコアを算出するPolicy。
export class ScorePolicy {
  // 最大点とクランプ1成分あたりの減点量を検証して保持する。
  constructor(
    readonly maximumScore: number,
    readonly clampPenalty: number,
  ) {
    if (!Number.isSafeInteger(maximumScore) || maximumScore <= 0) {
      throw new RangeError('Maximum score must be a positive integer.');
    }
    if (!Number.isSafeInteger(clampPenalty) || clampPenalty < 0) {
      throw new RangeError('Clamp penalty must be a non-negative integer.');
    }
  }

  // 手札の色を採点し、クランプ数に応じた上限内のスコアを返す。
  calculate(hand: Hand): number {
    const channelLimit = Hand.CHANNEL_LIMIT;
    const maximumDistance = Math.sqrt(3 * channelLimit ** 2);
    const distance = Math.sqrt(
      (channelLimit - hand.color.red) ** 2 +
        (channelLimit - hand.color.green) ** 2 +
        (channelLimit - hand.color.blue) ** 2,
    );
    const scoreCeiling = Math.max(
      0,
      this.maximumScore - hand.clampedChannels.size * this.clampPenalty,
    );
    const normalizedScore = Math.round(
      (1 - distance / maximumDistance) * this.maximumScore,
    );
    return Math.max(0, Math.min(scoreCeiling, normalizedScore));
  }
}
