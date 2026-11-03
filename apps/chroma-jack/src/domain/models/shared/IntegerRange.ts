// 整数範囲を生成できなかった理由を示す。
export enum IntegerRangeCreationFailure {
  // 最小値または最大値が安全な整数ではない。
  NotInteger = 'notInteger',
  // 最小値が最大値を上回っている。
  MinimumExceedsMaximum = 'minimumExceedsMaximum',
}

// 検証済みの最小値と最大値を保持する整数範囲のValue Object。
export class IntegerRange {
  // 検証済みの境界値を保持する範囲を組み立てる。
  private constructor(
    readonly minimum: number,
    readonly maximum: number,
  ) {}

  // 境界値を検証し、整数範囲または生成失敗理由を返す。
  static create(
    minimum: number,
    maximum: number,
  ): IntegerRange | IntegerRangeCreationFailure {
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum)) {
      return IntegerRangeCreationFailure.NotInteger;
    }
    if (minimum > maximum) {
      return IntegerRangeCreationFailure.MinimumExceedsMaximum;
    }
    return new IntegerRange(minimum, maximum);
  }

  // 指定値がこの範囲に含まれる安全な整数かを返す。
  contains(value: number): boolean {
    return (
      Number.isSafeInteger(value) &&
      value >= this.minimum &&
      value <= this.maximum
    );
  }
}
