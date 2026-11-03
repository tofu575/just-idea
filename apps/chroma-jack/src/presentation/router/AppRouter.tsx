import { useMemo, useState } from 'react';
import { GamePage } from '../pages/GamePage';
import { ResultPage } from '../pages/ResultPage';
import { TitlePage } from '../pages/TitlePage';
import { useChromaJack } from '../providers/useChromaJack';
import { GameRules } from '../../domain/models/rules/GameRules';
import {
  createBuiltInRuleOptions,
  type SelectableGameRule,
} from '../rules/SelectableGameRule';

const CLASSIC_RULES = GameRules.classic();
const CLAMP_CHALLENGE_RULES = GameRules.clampChallenge();
const SPECIAL_DECK_RULES = GameRules.specialDeck();
const BUILT_IN_RULE_OPTIONS = createBuiltInRuleOptions({
  classic: CLASSIC_RULES,
  clampChallenge: CLAMP_CHALLENGE_RULES,
  specialDeck: SPECIAL_DECK_RULES,
});

type AppRouterProps = {
  initialRules?: GameRules;
};

// ゲーム状態に応じてタイトル・プレイ・最終結果画面を切り替える。
export function AppRouter({ initialRules = CLASSIC_RULES }: AppRouterProps) {
  const ruleOptions = useMemo(() => {
    const options = new Map<string, SelectableGameRule>(
      BUILT_IN_RULE_OPTIONS.map((option) => [option.rules.id, option]),
    );
    const matchingOption = options.get(initialRules.id);
    options.set(initialRules.id, {
      rules: initialRules,
      labelKey: matchingOption?.labelKey ?? `rules.${initialRules.id}.label`,
      descriptionKey:
        matchingOption?.descriptionKey ??
        `rules.${initialRules.id}.description`,
    });
    return [...options.values()];
  }, [initialRules]);
  const [selectedRulesId, setSelectedRulesId] = useState(initialRules.id);
  const selectedRuleOption =
    ruleOptions.find((option) => option.rules.id === selectedRulesId) ??
    ruleOptions[0];
  if (selectedRuleOption === undefined) {
    throw new RangeError('At least one selectable game rule is required.');
  }
  const {
    game,
    totalRounds,
    totalScore,
    maximumScore,
    beginGame,
    acceptCard,
    discardOffer,
    standRound,
    advanceRound,
    goToTitle,
  } = useChromaJack(selectedRuleOption.rules);

  if (game.phase === 'notStarted') {
    return (
      <TitlePage
        ruleOptions={ruleOptions}
        selectedRulesId={selectedRuleOption.rules.id}
        onSelectRules={setSelectedRulesId}
        onStart={beginGame}
      />
    );
  }
  if (game.phase === 'gameFinished') {
    return (
      <ResultPage
        totalScore={totalScore}
        totalRounds={totalRounds}
        maximumScore={maximumScore}
        results={game.roundResults}
        onReplay={beginGame}
        onTitle={goToTitle}
      />
    );
  }
  return (
    <GamePage
      game={game}
      totalRounds={totalRounds}
      totalScore={totalScore}
      onAccept={acceptCard}
      onDiscard={discardOffer}
      onStand={standRound}
      onContinue={advanceRound}
    />
  );
}
