import { GameCard } from '../card/GameCard';
import { Hand } from '../hand/Hand';
import { IntegerRange } from '../shared/IntegerRange';
import {
  ColorGenerationPolicy,
  ColorGenerationTrend,
} from './ColorGenerationPolicy';
import { OverflowPolicy } from './OverflowPolicy';
import { ScorePolicy } from './ScorePolicy';
import {
  CardTypeDistribution,
  createCardTypeWeights,
} from './CardTypeDistribution';

// 固定値から検証済みのルール用整数範囲を生成する。
function createRange(minimum: number, maximum: number): IntegerRange {
  const range = IntegerRange.create(minimum, maximum);
  if (!(range instanceof IntegerRange)) {
    throw new RangeError(`Invalid rule range: ${range}`);
  }
  return range;
}

// GameRulesの生成時に指定する設定値とPolicy一式。
export type GameRulesArgs = Readonly<{
  id: string;
  totalRounds: number;
  deckSize: number;
  cardOfferSize: number;
  initialColorRange: IntegerRange;
  cardColorRange: IntegerRange;
  initialColorGenerationPolicy: ColorGenerationPolicy;
  cardColorGenerationPolicy: ColorGenerationPolicy;
  cardTypeDistribution: CardTypeDistribution;
  overflowPolicy: OverflowPolicy;
  scorePolicy: ScorePolicy;
}>;

// 1ゲームで固定して使用する生成・超過・採点ルール一式。
export class GameRules {
  readonly id: string;
  readonly totalRounds: number;
  readonly deckSize: number;
  readonly cardOfferSize: number;
  readonly initialColorRange: IntegerRange;
  readonly cardColorRange: IntegerRange;
  readonly initialColorGenerationPolicy: ColorGenerationPolicy;
  readonly cardColorGenerationPolicy: ColorGenerationPolicy;
  readonly cardTypeDistribution: CardTypeDistribution;
  readonly overflowPolicy: OverflowPolicy;
  readonly scorePolicy: ScorePolicy;

  // 1ゲームで使用するすべてのPolicyと設定値を検証して保持する。
  constructor(args: GameRulesArgs) {
    if (args.id.trim().length === 0)
      throw new RangeError('Rules id is required.');
    if (!Number.isSafeInteger(args.totalRounds) || args.totalRounds <= 0) {
      throw new RangeError('Total rounds must be a positive integer.');
    }
    if (!Number.isSafeInteger(args.deckSize) || args.deckSize <= 0) {
      throw new RangeError('Deck size must be a positive integer.');
    }
    if (
      !Number.isSafeInteger(args.cardOfferSize) ||
      args.cardOfferSize <= 0 ||
      args.cardOfferSize > args.deckSize
    ) {
      throw new RangeError(
        'Card offer size must be a positive integer within the deck size.',
      );
    }
    if (
      args.initialColorRange.minimum < 0 ||
      args.initialColorRange.maximum > Hand.CHANNEL_LIMIT
    ) {
      throw new RangeError('Initial colors must fit within the hand limit.');
    }
    if (
      args.cardColorRange.minimum < GameCard.MINIMUM_CHANNEL ||
      args.cardColorRange.maximum > GameCard.MAXIMUM_CHANNEL ||
      args.cardColorRange.maximum === 0
    ) {
      throw new RangeError(
        'Card colors must fit within the card limits and allow a non-black card.',
      );
    }

    this.id = args.id;
    this.totalRounds = args.totalRounds;
    this.deckSize = args.deckSize;
    this.cardOfferSize = args.cardOfferSize;
    this.initialColorRange = args.initialColorRange;
    this.cardColorRange = args.cardColorRange;
    this.initialColorGenerationPolicy = args.initialColorGenerationPolicy;
    this.cardColorGenerationPolicy = args.cardColorGenerationPolicy;
    this.cardTypeDistribution = args.cardTypeDistribution;
    this.overflowPolicy = args.overflowPolicy;
    this.scorePolicy = args.scorePolicy;
  }

  // 従来のバースト終了ルールを生成する。
  static classic(): GameRules {
    return new GameRules({
      id: 'classic',
      totalRounds: 5,
      deckSize: 12,
      cardOfferSize: 1,
      initialColorRange: createRange(0, 20),
      cardColorRange: createRange(
        GameCard.MINIMUM_CHANNEL,
        GameCard.MAXIMUM_CHANNEL,
      ),
      initialColorGenerationPolicy: new ColorGenerationPolicy(
        ColorGenerationTrend.Lower,
      ),
      cardColorGenerationPolicy: new ColorGenerationPolicy(
        ColorGenerationTrend.Uniform,
      ),
      cardTypeDistribution: CardTypeDistribution.addColorOnly(),
      overflowPolicy: OverflowPolicy.classic(),
      scorePolicy: new ScorePolicy(1000, 0),
    });
  }

  // 超過成分を固定し、固定数に応じて得点上限を下げるルールを生成する。
  static clampChallenge(): GameRules {
    return new GameRules({
      id: 'clamp-challenge',
      totalRounds: 5,
      deckSize: 24,
      cardOfferSize: 3,
      initialColorRange: createRange(0, 159),
      cardColorRange: createRange(
        GameCard.MINIMUM_CHANNEL,
        GameCard.MAXIMUM_CHANNEL,
      ),
      initialColorGenerationPolicy: new ColorGenerationPolicy(
        ColorGenerationTrend.Lower,
      ),
      cardColorGenerationPolicy: new ColorGenerationPolicy(
        ColorGenerationTrend.Higher,
      ),
      cardTypeDistribution: CardTypeDistribution.addColorOnly(),
      overflowPolicy: OverflowPolicy.clampAndContinue(1),
      scorePolicy: new ScorePolicy(1000, 200),
    });
  }

  // すべての特殊カードを試せる3枚選択ルールを生成する。
  static specialDeck(): GameRules {
    return new GameRules({
      id: 'special-deck',
      totalRounds: 5,
      deckSize: 30,
      cardOfferSize: 3,
      initialColorRange: createRange(0, 127),
      cardColorRange: createRange(
        GameCard.MINIMUM_CHANNEL,
        GameCard.MAXIMUM_CHANNEL,
      ),
      initialColorGenerationPolicy: new ColorGenerationPolicy(
        ColorGenerationTrend.Lower,
      ),
      cardColorGenerationPolicy: new ColorGenerationPolicy(
        ColorGenerationTrend.Uniform,
      ),
      cardTypeDistribution: new CardTypeDistribution(
        createCardTypeWeights({
          addColor: 60,
          adjustChannels: 10,
          swapChannels: 10,
          adjustSaturation: 8,
          adjustBrightness: 8,
          continueRound: 5,
          revealColorValues: 5,
          preventBurst: 1,
        }),
      ),
      overflowPolicy: OverflowPolicy.classic(),
      scorePolicy: new ScorePolicy(1000, 0),
    });
  }
}
