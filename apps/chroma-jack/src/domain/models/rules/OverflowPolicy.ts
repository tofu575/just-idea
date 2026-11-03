// 255へ固定しながら続行できる色数の上限を保持するPolicy。
export class OverflowPolicy {
  static readonly MINIMUM_ALLOWED_BURST_COLORS = 0;
  static readonly MAXIMUM_ALLOWED_BURST_COLORS = 2;

  // 全色バーストを許可しないよう、0〜2の整数だけを受け付ける。
  constructor(readonly allowedBurstColors: number) {
    if (
      !Number.isSafeInteger(allowedBurstColors) ||
      allowedBurstColors < OverflowPolicy.MINIMUM_ALLOWED_BURST_COLORS ||
      allowedBurstColors > OverflowPolicy.MAXIMUM_ALLOWED_BURST_COLORS
    ) {
      throw new RangeError(
        'Allowed burst colors must be an integer from 0 to 2.',
      );
    }
  }

  // 累計バースト色数が許容量内なら、超過成分を255へ固定して続行する。
  canContinueWith(burstColorCount: number): boolean {
    return burstColorCount <= this.allowedBurstColors;
  }

  // 最初の1色が超過した時点で終了する従来ルールを生成する。
  static classic(): OverflowPolicy {
    return new OverflowPolicy(0);
  }

  // 指定色数まで255へ固定して続行できるルールを生成する。
  static clampAndContinue(allowedBurstColors: 1 | 2): OverflowPolicy {
    return new OverflowPolicy(allowedBurstColors);
  }
}
