import { describe, expect, it } from 'vitest';
import { FixedRandomGenerator } from '../../test/helpers/FixedRandomGenerator';
import { GameCard } from '../models/card/GameCard';
import { CardEffectKind } from '../models/card/effects/CardEffect';
import { Color } from '../models/color/Color';
import type { GameState } from '../models/game/Game';
import { GameRound } from '../models/game/GameRound';
import { GameScore } from '../models/game/GameScore';
import { Hand } from '../models/hand/Hand';
import { GameRules } from '../models/rules/GameRules';
import { IntegerRange } from '../models/shared/IntegerRange';
import { GameEngine } from './GameEngine';

// 指定した乱数列でClassicルールのEngineを生成する。
function createEngine(values: readonly number[]): GameEngine {
  return new GameEngine(GameRules.classic(), new FixedRandomGenerator(values));
}

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

describe('game actions', () => {
  it('範囲内の初期色と黒でない12枚のカードでラウンド1を始める', () => {
    const game = createEngine([0, 63, 127, 0]).startGame();
    const round = game.currentRound;

    expect(game.phase).toBe('playing');
    expect(round?.roundNumber).toBe(1);
    expect(round).not.toBeNull();
    expect(
      Object.values(round?.hand.color ?? {}).every(
        (channel) => channel >= 0 && channel <= 127,
      ),
    ).toBe(true);
    const deck = [
      ...(round?.offeredCards ?? []),
      ...(round?.remainingDeck ?? []),
    ];
    expect(deck).toHaveLength(12);
    deck.forEach((card) => {
      expect(card.effect.kind).toBe(CardEffectKind.AddColor);
      if (card.effect.kind !== CardEffectKind.AddColor) return;
      const channels = Object.values(card.effect.amount);
      expect(channels.every((channel) => channel >= 0 && channel <= 160)).toBe(
        true,
      );
      expect(channels.some((channel) => channel > 0)).toBe(true);
    });
  });

  it('加えると現在色を更新し、捨てると現在色を維持する', () => {
    const engine = createEngine([10]);
    const started = engine.startGame();
    const offeredCard = started.currentRound?.offeredCards[0];
    expect(offeredCard).toBeDefined();
    if (offeredCard === undefined) return;

    const accepted = engine.acceptOfferedCard(started, offeredCard.id);
    expect(accepted.currentRound?.hand.color).toMatchObject({
      red: 20,
      green: 20,
      blue: 20,
    });

    const discarded = engine.discardOffer(accepted);
    expect(discarded.currentRound?.hand).toBe(accepted.currentRound?.hand);
  });

  it('止めるとスコアを確定する', () => {
    const engine = createEngine([10]);
    const finished = engine.standCurrentRound(engine.startGame());
    expect(finished.phase).toBe('roundFinished');
    expect(finished.roundResults).toHaveLength(1);
    expect(finished.roundResults[0]?.endReason).toBe('stood');
    expect(finished.currentRound?.offeredCards).toHaveLength(1);
    expect(finished.currentRound?.remainingDeck).toHaveLength(11);
  });

  it('最後のカードを使うと山札切れで終了する', () => {
    const engine = createEngine([1]);
    let game = engine.startGame();
    for (let index = 0; index < 12; index += 1)
      game = engine.discardOffer(game);

    expect(game.phase).toBe('roundFinished');
    expect(game.roundResults[0]?.endReason).toBe('deckExhausted');
    expect(game.currentRound?.offeredCards).toHaveLength(0);
  });

  it('加算でバーストすると直前の色を保って0点にする', () => {
    const currentColor = Color.create(250, 10, 10);
    if (!(currentColor instanceof Color)) return;
    const currentCard = createCard('burst', 6, 1, 1);
    const state: GameState = {
      phase: 'playing',
      currentRound: new GameRound({
        roundNumber: 1,
        hand: new Hand(currentColor),
        offeredCards: [currentCard],
        remainingDeck: [],
      }),
      roundResults: [],
    };

    const finished = createEngine([1]).acceptOfferedCard(state, currentCard.id);
    expect(finished.phase).toBe('roundFinished');
    expect(finished.currentRound?.hand).toBe(state.currentRound?.hand);
    expect(finished.roundResults[0]).toMatchObject({
      score: 0,
      endReason: 'burst',
    });
    expect(finished.roundResults[0]?.burstHand?.color).toMatchObject({
      red: 256,
      green: 11,
      blue: 11,
    });
    expect(finished.roundResults[0]?.burstChannels).toHaveLength(1);
  });

  it('5ラウンド後に終了し、合計スコアを算出する', () => {
    const engine = createEngine([10]);
    let game = engine.startGame();
    for (let round = 1; round <= 5; round += 1) {
      game = engine.standCurrentRound(game);
      game = engine.startNextRound(game);
    }
    expect(game.phase).toBe('gameFinished');
    expect(game.roundResults).toHaveLength(5);
    expect(GameScore.calculate(game.roundResults).value).toBe(
      game.roundResults.reduce((total, result) => total + result.score, 0),
    );
  });

  it('不正な状態の操作では状態を変更しない', () => {
    const engine = createEngine([10]);
    const finished = engine.standCurrentRound(engine.startGame());
    expect(engine.acceptOfferedCard(finished, 'missing')).toBe(finished);
    expect(engine.discardOffer(finished)).toBe(finished);
  });

  it('外から注入した初期色上限を使用する', () => {
    const base = GameRules.classic();
    const initialRange = IntegerRange.create(0, 10);
    if (!(initialRange instanceof IntegerRange)) return;
    const rules = new GameRules({
      id: 'small-initial-color',
      totalRounds: base.totalRounds,
      deckSize: base.deckSize,
      cardOfferSize: base.cardOfferSize,
      initialColorRange: initialRange,
      cardColorRange: base.cardColorRange,
      initialColorGenerationPolicy: base.initialColorGenerationPolicy,
      cardColorGenerationPolicy: base.cardColorGenerationPolicy,
      cardTypeDistribution: base.cardTypeDistribution,
      overflowPolicy: base.overflowPolicy,
      scorePolicy: base.scorePolicy,
    });
    const game = new GameEngine(
      rules,
      new FixedRandomGenerator([127]),
    ).startGame();

    expect(game.currentRound?.hand.color).toMatchObject({
      red: 10,
      green: 10,
      blue: 10,
    });
  });

  it('クランプルールでは超過後も次のカードへ進み、得点上限を下げる', () => {
    const rules = GameRules.clampChallenge();
    const engine = new GameEngine(rules, new FixedRandomGenerator([1]));
    const color = Color.create(250, 255, 255);
    if (!(color instanceof Color)) return;
    const currentCard = createCard('current', 10, 0, 0);
    const nextCard = createCard('next', 1, 1, 1);
    const state: GameState = {
      phase: 'playing',
      currentRound: new GameRound({
        roundNumber: 1,
        hand: new Hand(color),
        offeredCards: [
          currentCard,
          createCard('discarded-1', 1, 0, 0),
          createCard('discarded-2', 0, 1, 0),
        ],
        remainingDeck: [nextCard],
      }),
      roundResults: [],
    };

    const continued = engine.acceptOfferedCard(state, currentCard.id);
    expect(continued.phase).toBe('playing');
    expect(continued.currentRound?.hand.color.red).toBe(255);
    expect(continued.currentRound?.hand.clampedChannels.size).toBe(1);
    expect(continued.currentRound?.offeredCards.map((card) => card.id)).toEqual(
      ['next'],
    );

    const finished = engine.standCurrentRound(continued);
    expect(finished.roundResults[0]?.score).toBe(800);
  });
});
