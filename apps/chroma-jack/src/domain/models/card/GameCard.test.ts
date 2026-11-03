import { describe, expect, it } from 'vitest';
import { Color } from '../color/Color';
import { Hand } from '../hand/Hand';
import { OverflowPolicy } from '../rules/OverflowPolicy';
import { GameCard, GameCardCreationFailure } from './GameCard';

describe('GameCard', () => {
  it('RGB加算効果を持つ通常カードを生成する', () => {
    const card = GameCard.createAddColor('card', 0, 10, 160);
    expect(card).toBeInstanceOf(GameCard);
  });

  it.each([
    ['', 1, 1, 1, GameCardCreationFailure.EmptyId],
    ['card', -1, 1, 1, GameCardCreationFailure.InvalidChannel],
    ['card', 161, 1, 1, GameCardCreationFailure.InvalidChannel],
    ['card', 0.5, 1, 1, GameCardCreationFailure.InvalidChannel],
    ['card', 0, 0, 0, GameCardCreationFailure.Black],
  ])('不正値を生成失敗として返す', (id, red, green, blue, expected) => {
    expect(GameCard.createAddColor(id, red, green, blue)).toBe(expected);
  });

  it('AddColorEffectを通じてHandへ色を加える', () => {
    const color = Color.create(10, 20, 30);
    const card = GameCard.createAddColor('card', 1, 2, 3);
    if (!(color instanceof Color) || !(card instanceof GameCard)) return;

    const addition = card.applyTo({
      hand: new Hand(color),
      overflowPolicy: OverflowPolicy.classic(),
      canPreventBurst: false,
    });

    expect(addition.burstHand).toBeNull();
    expect(addition.hand.color).toMatchObject({ red: 11, green: 22, blue: 33 });
  });
});
