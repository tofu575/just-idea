import { describe, expect, it } from 'vitest';
import { IntegerRange } from '../shared/IntegerRange';
import { GameRules } from './GameRules';

describe('GameRules', () => {
  it('オブジェクト引数から各設定を名前どおり保持する', () => {
    const rules = GameRules.clampChallenge();

    expect(rules.id).toBe('clamp-challenge');
    expect(rules.totalRounds).toBe(5);
    expect(rules.deckSize).toBe(24);
    expect(rules.cardOfferSize).toBe(3);
    expect(rules.initialColorRange.maximum).toBe(159);
    expect(rules.cardColorRange.maximum).toBe(160);
    expect(rules.overflowPolicy.allowedBurstColors).toBe(1);
    expect(rules.scorePolicy.clampPenalty).toBe(200);
  });

  it('黒以外のカードを生成できない範囲を拒否する', () => {
    const base = GameRules.classic();
    const blackOnlyRange = IntegerRange.create(0, 0);
    expect(blackOnlyRange).toBeInstanceOf(IntegerRange);
    if (!(blackOnlyRange instanceof IntegerRange)) return;

    expect(
      () =>
        new GameRules({
          id: 'invalid',
          totalRounds: base.totalRounds,
          deckSize: base.deckSize,
          cardOfferSize: base.cardOfferSize,
          initialColorRange: base.initialColorRange,
          cardColorRange: blackOnlyRange,
          initialColorGenerationPolicy: base.initialColorGenerationPolicy,
          cardColorGenerationPolicy: base.cardColorGenerationPolicy,
          cardTypeDistribution: base.cardTypeDistribution,
          overflowPolicy: base.overflowPolicy,
          scorePolicy: base.scorePolicy,
        }),
    ).toThrow(RangeError);
  });

  it('候補枚数が山札枚数を超える設定を拒否する', () => {
    const base = GameRules.classic();

    expect(
      () =>
        new GameRules({
          id: 'invalid-offer-size',
          totalRounds: base.totalRounds,
          deckSize: base.deckSize,
          cardOfferSize: base.deckSize + 1,
          initialColorRange: base.initialColorRange,
          cardColorRange: base.cardColorRange,
          initialColorGenerationPolicy: base.initialColorGenerationPolicy,
          cardColorGenerationPolicy: base.cardColorGenerationPolicy,
          cardTypeDistribution: base.cardTypeDistribution,
          overflowPolicy: base.overflowPolicy,
          scorePolicy: base.scorePolicy,
        }),
    ).toThrow(RangeError);
  });
});
