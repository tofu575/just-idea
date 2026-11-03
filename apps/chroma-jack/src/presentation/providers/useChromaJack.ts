import { useCallback, useRef, useState } from 'react';
import { GameScore } from '../../domain/models/game/GameScore';
import type { GameRules } from '../../domain/models/rules/GameRules';
import { GameEngine } from '../../domain/usecases/GameEngine';
import { BrowserRandomGenerator } from '../../gateway/repositories/BrowserRandomGenerator';

// 注入されたルールとReactの画面状態をGameEngineへ接続する。
export function useChromaJack(rules: GameRules) {
  const engine = useRef(new GameEngine(rules, new BrowserRandomGenerator()));
  const pendingRules = useRef(rules);
  pendingRules.current = rules;
  const [game, setGame] = useState(() => engine.current.createInitialState());

  const beginGame = useCallback(() => {
    if (engine.current.rules !== pendingRules.current) {
      engine.current = new GameEngine(
        pendingRules.current,
        new BrowserRandomGenerator(),
      );
    }
    setGame(engine.current.startGame());
  }, []);
  const acceptCard = useCallback(
    (cardId: string) =>
      setGame((current) => engine.current.acceptOfferedCard(current, cardId)),
    [],
  );
  const discardOffer = useCallback(
    () => setGame((current) => engine.current.discardOffer(current)),
    [],
  );
  const standRound = useCallback(
    () => setGame((current) => engine.current.standCurrentRound(current)),
    [],
  );
  const advanceRound = useCallback(
    () => setGame((current) => engine.current.startNextRound(current)),
    [],
  );
  const goToTitle = useCallback(
    () => setGame(engine.current.returnToTitle()),
    [],
  );

  return {
    game,
    totalRounds: engine.current.rules.totalRounds,
    totalScore: GameScore.calculate(game.roundResults).value,
    maximumScore:
      engine.current.rules.totalRounds *
      engine.current.rules.scorePolicy.maximumScore,
    beginGame,
    acceptCard,
    discardOffer,
    standRound,
    advanceRound,
    goToTitle,
  };
}
