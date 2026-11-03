import { describe, expect, it } from 'vitest';
import { Color } from '../color/Color';
import { ColorChannel } from '../color/ColorChannel';
import { OverflowPolicy } from '../rules/OverflowPolicy';
import { ScorePolicy } from '../rules/ScorePolicy';
import { Hand, HandAdditionStatus } from './Hand';

function createHand(red: number, green: number, blue: number): Hand {
  const color = Color.create(red, green, blue);
  if (!(color instanceof Color)) throw new Error('Invalid test color');
  return new Hand(color);
}

function createAmount(red: number, green: number, blue: number): Color {
  const amount = Color.create(red, green, blue);
  if (!(amount instanceof Color)) throw new Error('Invalid test color amount');
  return amount;
}

describe('Hand', () => {
  const endRound = OverflowPolicy.classic();
  const scoring = new ScorePolicy(1000, 200);

  it('カード加算とバースト判定を自身のロジックとして行う', () => {
    const safeAddition = createHand(250, 250, 250).addColor(
      createAmount(5, 5, 5),
      endRound,
    );
    expect(safeAddition.status).toBe(HandAdditionStatus.Added);
    expect(safeAddition.hand.color).toMatchObject({
      red: 255,
      green: 255,
      blue: 255,
    });

    const burstAddition = safeAddition.hand.addColor(
      createAmount(1, 1, 1),
      endRound,
    );
    expect(burstAddition.status).toBe(HandAdditionStatus.Burst);
    expect(burstAddition.hand.color).toMatchObject({
      red: 256,
      green: 256,
      blue: 256,
    });
  });

  it('白を1000点、黒を0点にする', () => {
    expect(scoring.calculate(createHand(255, 255, 255))).toBe(1000);
    expect(scoring.calculate(createHand(0, 0, 0))).toBe(0);
  });

  it('超過成分を255へ固定して続行し、スコア上限を下げる', () => {
    const addition = createHand(250, 255, 255).addColor(
      createAmount(10, 0, 0),
      OverflowPolicy.clampAndContinue(1),
    );
    expect(addition.status).toBe(HandAdditionStatus.Added);
    expect(addition.hand.color).toMatchObject({
      red: 255,
      green: 255,
      blue: 255,
    });
    expect(addition.hand.clampedChannels.size).toBe(1);
    expect(scoring.calculate(addition.hand)).toBe(800);
  });

  it('許容色数までは固定して続行し、超えると累計色数でバーストする', () => {
    const policy = OverflowPolicy.clampAndContinue(1);
    const redOverflow = createHand(250, 250, 10).addColor(
      createAmount(10, 0, 0),
      policy,
    );
    expect(redOverflow.status).toBe(HandAdditionStatus.Added);
    expect(redOverflow.hand.color.red).toBe(255);

    const greenOverflow = redOverflow.hand.addColor(
      createAmount(0, 10, 0),
      policy,
    );
    expect(greenOverflow.status).toBe(HandAdditionStatus.Burst);
    expect(greenOverflow.hand.clampedChannels).toEqual(
      new Set([ColorChannel.Red, ColorChannel.Green]),
    );
  });

  it('同じ色の再超過はバースト色数を増やさない', () => {
    const policy = OverflowPolicy.clampAndContinue(1);
    const first = createHand(250, 10, 10).addColor(
      createAmount(10, 0, 0),
      policy,
    );
    const second = first.hand.addColor(createAmount(10, 0, 0), policy);

    expect(second.status).toBe(HandAdditionStatus.Added);
    expect(second.hand.clampedChannels).toEqual(new Set([ColorChannel.Red]));
  });

  it('2色を許容すると3色目の超過で終了する', () => {
    const policy = OverflowPolicy.clampAndContinue(2);
    const first = createHand(250, 250, 250).addColor(
      createAmount(10, 0, 0),
      policy,
    );
    const second = first.hand.addColor(createAmount(0, 10, 0), policy);
    const third = second.hand.addColor(createAmount(0, 0, 10), policy);

    expect(first.status).toBe(HandAdditionStatus.Added);
    expect(second.status).toBe(HandAdditionStatus.Added);
    expect(third.status).toBe(HandAdditionStatus.Burst);
    expect(third.hand.clampedChannels.size).toBe(3);
  });

  it('1回の加算で許容数より多く超過すると終了する', () => {
    const addition = createHand(250, 250, 10).addColor(
      createAmount(10, 10, 0),
      OverflowPolicy.clampAndContinue(1),
    );

    expect(addition.status).toBe(HandAdditionStatus.Burst);
    expect(addition.hand.clampedChannels.size).toBe(2);
  });

  it('許容バースト色数は0から2の整数に制限する', () => {
    expect(() => new OverflowPolicy(-1)).toThrow(RangeError);
    expect(() => new OverflowPolicy(1.5)).toThrow(RangeError);
    expect(() => new OverflowPolicy(3)).toThrow(RangeError);
  });

  it('外部のSet変更からクランプ履歴を保護する', () => {
    const channels = new Set<ColorChannel>([ColorChannel.Red]);
    const hand = new Hand(createHand(255, 255, 255).color, channels);
    channels.add(ColorChannel.Green);

    expect(hand.clampedChannels).toEqual(new Set([ColorChannel.Red]));
  });

  it('白に近い色ほど高い整数スコアにする', () => {
    const middle = scoring.calculate(createHand(100, 100, 100));
    const nearWhite = scoring.calculate(createHand(230, 230, 230));
    expect(Number.isInteger(middle)).toBe(true);
    expect(nearWhite).toBeGreaterThan(middle);
  });
});
