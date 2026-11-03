import type { RoundResult } from './Round';

// 確定済みラウンドの合計点を保持するValue Object。
export class GameScore {
  // 算出済みの合計点を保持する。
  private constructor(readonly value: number) {}

  // ラウンド結果を集計してゲーム全体のスコアを生成する。
  static calculate(roundResults: readonly RoundResult[]): GameScore {
    return new GameScore(
      roundResults.reduce((total, result) => total + result.score, 0),
    );
  }
}
