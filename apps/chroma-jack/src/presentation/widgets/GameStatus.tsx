import { useEffect, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type GameStatusProps = {
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  cardsRemaining: number;
};

// 現在ラウンド、確定済み合計点、カード残数を表示する。
export function GameStatus({
  currentRound,
  totalRounds,
  totalScore,
  cardsRemaining,
}: GameStatusProps) {
  const { t, i18n } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [currentRound]);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      gap={2}
      sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Box>
        <Typography variant="overline" color="text.secondary">
          {t('game.round')}
        </Typography>
        <Typography
          ref={headingRef}
          tabIndex={-1}
          variant="h5"
          component="h1"
          fontWeight={750}
        >
          {currentRound} / {totalRounds}
        </Typography>
      </Box>
      <Stack direction="row" spacing={{ xs: 2.5, sm: 5 }} textAlign="right">
        <Box>
          <Typography variant="overline" color="text.secondary">
            {t('game.total')}
          </Typography>
          <Typography fontWeight={700}>
            {t('game.points', {
              value: totalScore.toLocaleString(i18n.language),
            })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {t('game.remaining')}
          </Typography>
          <Typography fontWeight={700}>
            {t('game.cards', { count: cardsRemaining })}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}
