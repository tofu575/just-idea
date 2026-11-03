import { describe, expect, it } from 'vitest';
import { FixedRandomGenerator } from '../../../test/helpers/FixedRandomGenerator';
import { IntegerRange } from '../shared/IntegerRange';
import {
  ColorGenerationPolicy,
  ColorGenerationTrend,
} from './ColorGenerationPolicy';

function createRange(): IntegerRange {
  const range = IntegerRange.create(0, 10);
  if (!(range instanceof IntegerRange)) throw new Error('Invalid test range');
  return range;
}

describe('ColorGenerationPolicy', () => {
  it('生成傾向を差し替えられる', () => {
    const range = createRange();
    const higher = new ColorGenerationPolicy(ColorGenerationTrend.Higher);
    const lower = new ColorGenerationPolicy(ColorGenerationTrend.Lower);

    expect(
      higher.generateChannel(range, new FixedRandomGenerator([2, 8])),
    ).toBe(8);
    expect(lower.generateChannel(range, new FixedRandomGenerator([2, 8]))).toBe(
      2,
    );
  });
});
