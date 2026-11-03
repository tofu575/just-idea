import { describe, expect, it } from 'vitest';
import { GameCard } from '../card/GameCard';
import { CardEffectKind } from '../card/effects/CardEffect';
import {
  ContinueRoundEffect,
  PreventBurstEffect,
  RevealColorValuesEffect,
} from '../card/effects/RoundModifierEffects';
import { Color } from '../color/Color';
import { Hand } from '../hand/Hand';
import { OverflowPolicy } from '../rules/OverflowPolicy';
import { GameRound, GameRoundActionStatus } from './GameRound';

// テスト用の通常加算カードを生成する。
function createCard(
  id: string,
  red: number,
  green: number,
  blue: number,
): GameCard {
  const card = GameCard.createAddColor(id, red, green, blue);
  if (!(card instanceof GameCard)) throw new Error('Invalid test card');
  return card;
}

// 指定した候補と山札を持つテスト用ラウンドを生成する。
function createRound(
  offeredCards: readonly GameCard[],
  remainingDeck: readonly GameCard[],
): GameRound {
  const color = Color.create(10, 10, 10);
  if (!(color instanceof Color)) throw new Error('Invalid test color');
  return new GameRound({
    roundNumber: 1,
    hand: new Hand(color),
    offeredCards,
    remainingDeck,
  });
}

// 指定したラウンド操作効果を持つテスト用特殊カードを生成する。
function createSpecialCard(
  id: string,
  kind:
    | CardEffectKind.ContinueRound
    | CardEffectKind.RevealColorValues
    | CardEffectKind.PreventBurst,
  effect: ContinueRoundEffect | RevealColorValuesEffect | PreventBurstEffect,
): GameCard {
  if (effect.kind !== kind) throw new Error('Invalid test effect kind');
  const card = GameCard.createSpecial({ id, effect });
  if (!(card instanceof GameCard)) throw new Error('Invalid test special card');
  return card;
}

describe('GameRound', () => {
  it('選択したカードの効果だけを適用し、未選択候補を捨てて次候補を公開する', () => {
    const selected = createCard('selected', 5, 0, 0);
    const next = createCard('next', 1, 1, 1);
    const round = createRound(
      [
        selected,
        createCard('discarded-1', 0, 5, 0),
        createCard('discarded-2', 0, 0, 5),
      ],
      [next],
    );

    const action = round.playCard({
      cardId: selected.id,
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 3,
    });

    expect(action.status).toBe(GameRoundActionStatus.Continued);
    expect(action.round.hand.color).toMatchObject({
      red: 15,
      green: 10,
      blue: 10,
    });
    expect(action.round.offeredCards.map((card) => card.id)).toEqual(['next']);
  });

  it('候補にないカードIDではラウンドを変更しない', () => {
    const round = createRound([createCard('offered', 1, 1, 1)], []);
    const action = round.playCard({
      cardId: 'missing',
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 1,
    });

    expect(action.status).toBe(GameRoundActionStatus.CardNotOffered);
    expect(action.round).toBe(round);
  });

  it('最後の候補を適用すると山札切れを返す', () => {
    const round = createRound([createCard('last', 1, 1, 1)], []);
    const action = round.playCard({
      cardId: 'last',
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 1,
    });

    expect(action.status).toBe(GameRoundActionStatus.DeckExhausted);
    expect(action.round.hand.color).toMatchObject({
      red: 11,
      green: 11,
      blue: 11,
    });
  });

  it('継続効果では未選択候補を捨てずに維持する', () => {
    const continueCard = createSpecialCard(
      'continue',
      CardEffectKind.ContinueRound,
      new ContinueRoundEffect(),
    );
    const keptCard = createCard('kept', 1, 1, 1);
    const action = createRound([continueCard, keptCard], []).playCard({
      cardId: continueCard.id,
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 2,
    });

    expect(action.status).toBe(GameRoundActionStatus.Continued);
    expect(action.round.offeredCards.map((card) => card.id)).toEqual(['kept']);
  });

  it('数値表示解禁をラウンド終了まで保持する', () => {
    const revealCard = createSpecialCard(
      'reveal',
      CardEffectKind.RevealColorValues,
      new RevealColorValuesEffect(),
    );
    const action = createRound(
      [revealCard],
      [createCard('next', 1, 1, 1)],
    ).playCard({
      cardId: revealCard.id,
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 1,
    });

    expect(action.round.revealsColorValues).toBe(true);
  });

  it('防止効果が次の終了バーストだけを255固定へ変え、その後も続行する', () => {
    const color = Color.create(250, 10, 10);
    if (!(color instanceof Color)) return;
    const preventionCard = createSpecialCard(
      'prevent',
      CardEffectKind.PreventBurst,
      new PreventBurstEffect(),
    );
    const burstCard = createCard('burst', 10, 0, 0);
    const safeCard = createCard('safe', 0, 1, 0);
    const finalCard = createCard('final', 0, 0, 1);
    const round = new GameRound({
      roundNumber: 1,
      hand: new Hand(color),
      offeredCards: [preventionCard],
      remainingDeck: [burstCard, safeCard, finalCard],
    });
    const protectedRound = round.playCard({
      cardId: preventionCard.id,
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 1,
    }).round;
    const action = protectedRound.playCard({
      cardId: burstCard.id,
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 1,
    });

    expect(action.status).toBe(GameRoundActionStatus.Continued);
    expect(action.round.hand.color.red).toBe(255);
    expect(action.round.burstPreventionCount).toBe(0);

    const safeAction = action.round.playCard({
      cardId: safeCard.id,
      overflowPolicy: OverflowPolicy.classic(),
      cardOfferSize: 1,
    });
    expect(safeAction.status).toBe(GameRoundActionStatus.Continued);
    expect(safeAction.round.hand.color.green).toBe(11);
  });
});
