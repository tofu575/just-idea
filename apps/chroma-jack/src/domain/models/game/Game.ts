import type { RoundResult } from './Round';
import type { GameRound } from './GameRound';

// ゲーム全体が現在どの進行段階にあるかを示す。
export type GamePhase =
  | 'notStarted'
  | 'playing'
  | 'roundFinished'
  | 'gameFinished';

// 画面描画と状態遷移に使用する、ある時点のゲーム状態。
export type GameState = Readonly<{
  // ゲームの進行段階を示す。
  phase: GamePhase;
  // 現在進行中または直前に終了したラウンド。ゲーム開始前はnull。
  currentRound: GameRound | null;
  // 現在までに終了したラウンドの結果。ラウンド開始前は空配列。
  roundResults: readonly RoundResult[];
}>;
