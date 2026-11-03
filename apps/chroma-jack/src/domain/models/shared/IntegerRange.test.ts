import { describe, expect, it } from 'vitest';
import { IntegerRange, IntegerRangeCreationFailure } from './IntegerRange';

describe('IntegerRange', () => {
  it('検証済みの整数範囲を生成する', () => {
    const range = IntegerRange.create(0, 63);
    expect(range).toBeInstanceOf(IntegerRange);
    if (!(range instanceof IntegerRange)) return;
    expect(range.contains(0)).toBe(true);
    expect(range.contains(63)).toBe(true);
    expect(range.contains(64)).toBe(false);
  });

  it('不正な範囲はenumで失敗理由を返す', () => {
    expect(IntegerRange.create(0.5, 63)).toBe(
      IntegerRangeCreationFailure.NotInteger,
    );
    expect(IntegerRange.create(64, 63)).toBe(
      IntegerRangeCreationFailure.MinimumExceedsMaximum,
    );
  });
});
