import type { RandomGenerator } from '../../domain/repositories/RandomGenerator';
import type { IntegerRange } from '../../domain/models/shared/IntegerRange';

export class FixedRandomGenerator implements RandomGenerator {
  private index = 0;

  constructor(private readonly values: readonly number[]) {}

  nextInteger(range: IntegerRange): number {
    const value = this.values[this.index % this.values.length];
    this.index += 1;
    if (value === undefined) return range.minimum;
    return Math.max(range.minimum, Math.min(range.maximum, value));
  }
}
