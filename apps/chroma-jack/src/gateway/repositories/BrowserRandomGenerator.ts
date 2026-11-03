import type { RandomGenerator } from '../../domain/repositories/RandomGenerator';
import type { IntegerRange } from '../../domain/models/shared/IntegerRange';

// Math.randomをDomainの乱数生成契約へ適合させるGateway。
export class BrowserRandomGenerator implements RandomGenerator {
  // 検証済み範囲の両端を含む整数乱数を返す。
  nextInteger(range: IntegerRange): number {
    return (
      Math.floor(Math.random() * (range.maximum - range.minimum + 1)) +
      range.minimum
    );
  }
}
