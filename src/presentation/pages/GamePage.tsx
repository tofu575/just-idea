import { Box, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GameState } from '../../domain/models/game/Game';
import type { GameCardId } from '../../domain/models/card/GameCardId';
import type { ScoreTarget } from '../../domain/models/rules/ScorePolicy';
import { ActionButtons } from '../widgets/ActionButtons';
import { CardOffer } from '../widgets/CardOffer';
import { ColorPanel } from '../widgets/ColorPanel';
import { GameStatus } from '../widgets/GameStatus';
import { RoundResult } from '../widgets/RoundResult';
import { ColorValueSummary } from '../widgets/ColorValueSummary';
import { ColorRiskSummary } from '../widgets/ColorRiskSummary';

type GamePageProps = {
  game: GameState;
  totalRounds: number;
  totalScore: number;
  scoreTarget: ScoreTarget;
  onAccept: (cardId: GameCardId) => void;
  onDiscard: () => void;
  onStand: () => void;
  onContinue: () => void;
};

// 現在のラウンド状態、色面、操作またはラウンド結果を表示する。
export function GamePage({
  game,
  totalRounds,
  totalScore,
  scoreTarget,
  onAccept,
  onDiscard,
  onStand,
  onContinue,
}: GamePageProps) {
  const { t } = useTranslation();
  const result = game.roundResults.at(-1);
  const round = game.currentRound;
  const displayedColor =
    game.phase === 'roundFinished' && result?.endReason === 'burst'
      ? result.burstHand.color
      : round?.hand.color;
  const cardsRemaining =
    (round?.remainingDeck.length ?? 0) + (round?.offeredCards.length ?? 0);

  return (
    <Container maxWidth="lg" component="main" sx={{ py: { xs: 2.5, sm: 4 } }}>
      <GameStatus
        currentRound={round?.roundNumber.value ?? 0}
        totalRounds={totalRounds}
        totalScore={totalScore}
        cardsRemaining={cardsRemaining}
      />
      <Stack sx={{ mt: 3 }}>
        {displayedColor && <ColorPanel color={displayedColor} />}
        {game.phase === 'playing' && round && (
          <ColorRiskSummary color={round.hand.color} target={scoreTarget} />
        )}
        {game.phase === 'playing' && round?.revealsColorValues && (
          <ColorValueSummary
            color={round.hand.color}
            label={t('game.revealedColorValues')}
            target={scoreTarget}
          />
        )}
        {game.phase === 'playing' && round && round.offeredCards.length > 0 && (
          <CardOffer cards={round.offeredCards} onAccept={onAccept} />
        )}
      </Stack>
      <Typography
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {game.phase === 'playing'
          ? t('game.statusAnnouncement', {
              round: round?.roundNumber.value ?? 0,
              cards: cardsRemaining,
            })
          : ''}
      </Typography>
      <Box>
        {game.phase === 'playing' && (
          <>
            {round && round.hand.clampedChannels.size > 0 && (
              <Typography role="status" sx={{ mt: 2, textAlign: 'center' }}>
                {t('game.continuedBurst', {
                  count: round.hand.clampedChannels.size,
                })}
              </Typography>
            )}
            {round && round.burstPreventionCount.hasAny() && (
              <Typography role="status" sx={{ mt: 2, textAlign: 'center' }}>
                {t('game.burstPrevention', {
                  count: round.burstPreventionCount.value,
                })}
              </Typography>
            )}
            <ActionButtons onDiscard={onDiscard} onStand={onStand} />
          </>
        )}
        {game.phase === 'roundFinished' && result && (
          <RoundResult
            result={result}
            isLastRound={round?.roundNumber.value === totalRounds}
            scoreTarget={scoreTarget}
            onContinue={onContinue}
          />
        )}
      </Box>
    </Container>
  );
}
