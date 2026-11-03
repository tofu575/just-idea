import type { GameCard } from '../card/GameCard';
import type { Hand } from '../hand/Hand';
import type { OverflowPolicy } from '../rules/OverflowPolicy';

// GameRoundへカードまたは破棄操作を適用した後の進行状態を示す。
export enum GameRoundActionStatus {
  // 操作を反映し、次の候補でラウンドを継続する。
  Continued = 'continued',
  // 操作後に山札と候補を使い切り、ラウンドを終了する。
  DeckExhausted = 'deckExhausted',
  // カード効果で許容数を超えてバーストし、ラウンドを終了する。
  Burst = 'burst',
  // 指定されたカードが現在の候補に存在せず、状態を変更しない。
  CardNotOffered = 'cardNotOffered',
}

// GameRoundの操作結果と、バースト時の加算後Handを保持する。
export type GameRoundAction = Readonly<{
  status: GameRoundActionStatus;
  round: GameRound;
  burstHand: Hand | null;
}>;

// 現在のHand、公開候補、山札を所有し、1ラウンド内のカード進行を実行する。
export class GameRound {
  readonly roundNumber: number;
  readonly hand: Hand;
  readonly offeredCards: readonly GameCard[];
  readonly remainingDeck: readonly GameCard[];
  readonly revealsColorValues: boolean;
  readonly burstPreventionCount: number;

  // ある時点のラウンド進行に必要な状態を保持する。
  constructor(args: {
    roundNumber: number;
    hand: Hand;
    offeredCards: readonly GameCard[];
    remainingDeck: readonly GameCard[];
    revealsColorValues?: boolean;
    burstPreventionCount?: number;
  }) {
    this.roundNumber = args.roundNumber;
    this.hand = args.hand;
    this.offeredCards = args.offeredCards;
    this.remainingDeck = args.remainingDeck;
    this.revealsColorValues = args.revealsColorValues ?? false;
    this.burstPreventionCount = args.burstPreventionCount ?? 0;
  }

  // 公開候補のカード効果をHandへ適用し、未選択候補を破棄して次へ進める。
  playCard(args: {
    cardId: string;
    overflowPolicy: OverflowPolicy;
    cardOfferSize: number;
  }): GameRoundAction {
    const selectedCard = this.offeredCards.find(
      (card) => card.id === args.cardId,
    );
    if (selectedCard === undefined) {
      return {
        status: GameRoundActionStatus.CardNotOffered,
        round: this,
        burstHand: null,
      };
    }

    // 手札にカードを加えた時の挙動は hand と overflowPolicy に委譲する。
    const effect = selectedCard.applyTo({
      hand: this.hand,
      overflowPolicy: args.overflowPolicy,
      canPreventBurst: this.burstPreventionCount > 0,
    });
    const nextBurstPreventionCount =
      this.burstPreventionCount -
      (effect.usedBurstPrevention ? 1 : 0) +
      (effect.grantBurstPrevention ? 1 : 0);
    if (effect.burstHand !== null) {
      return {
        status: GameRoundActionStatus.Burst,
        round: new GameRound({
          roundNumber: this.roundNumber,
          hand: this.hand,
          offeredCards: [],
          remainingDeck: this.remainingDeck,
          revealsColorValues:
            this.revealsColorValues || effect.revealColorValues,
          burstPreventionCount: nextBurstPreventionCount,
        }),
        burstHand: effect.burstHand,
      };
    }
    if (effect.preserveUnselectedCards) {
      const unselectedCards = this.offeredCards.filter(
        (card) => card.id !== selectedCard.id,
      );
      if (unselectedCards.length > 0) {
        return {
          status: GameRoundActionStatus.Continued,
          round: new GameRound({
            roundNumber: this.roundNumber,
            hand: effect.hand,
            offeredCards: unselectedCards,
            remainingDeck: this.remainingDeck,
            revealsColorValues:
              this.revealsColorValues || effect.revealColorValues,
            burstPreventionCount: nextBurstPreventionCount,
          }),
          burstHand: null,
        };
      }
    }
    return this.advanceOffer({
      hand: effect.hand,
      cardOfferSize: args.cardOfferSize,
      revealsColorValues: this.revealsColorValues || effect.revealColorValues,
      burstPreventionCount: nextBurstPreventionCount,
    });
  }

  // 現在の公開候補をすべて破棄し、Handを変えずに次へ進める。
  discardOffer(cardOfferSize: number): GameRoundAction {
    return this.advanceOffer({
      hand: this.hand,
      cardOfferSize,
      revealsColorValues: this.revealsColorValues,
      burstPreventionCount: this.burstPreventionCount,
    });
  }

  // 指定したHandを保持して次候補を公開し、山札が空なら終了を返す。
  private advanceOffer(args: {
    hand: Hand;
    cardOfferSize: number;
    revealsColorValues: boolean;
    burstPreventionCount: number;
  }): GameRoundAction {
    if (this.remainingDeck.length === 0) {
      return {
        status: GameRoundActionStatus.DeckExhausted,
        round: new GameRound({
          roundNumber: this.roundNumber,
          hand: args.hand,
          offeredCards: [],
          remainingDeck: [],
          revealsColorValues: args.revealsColorValues,
          burstPreventionCount: args.burstPreventionCount,
        }),
        burstHand: null,
      };
    }
    return {
      status: GameRoundActionStatus.Continued,
      round: new GameRound({
        roundNumber: this.roundNumber,
        hand: args.hand,
        offeredCards: this.remainingDeck.slice(0, args.cardOfferSize),
        remainingDeck: this.remainingDeck.slice(args.cardOfferSize),
        revealsColorValues: args.revealsColorValues,
        burstPreventionCount: args.burstPreventionCount,
      }),
      burstHand: null,
    };
  }
}
