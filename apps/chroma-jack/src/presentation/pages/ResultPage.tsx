import { useEffect, useRef } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { RoundResult } from '../../domain/models/game/Round';
import { ScoreList } from '../widgets/ScoreList';

type ResultPageProps = {
  totalScore: number;
  totalRounds: number;
  maximumScore: number;
  results: readonly RoundResult[];
  onReplay: () => void;
  onTitle: () => void;
};

// 全ラウンドの合計と内訳、再プレイ操作を表示する最終結果画面。
export function ResultPage({
  totalScore,
  totalRounds,
  maximumScore,
  results,
  onReplay,
  onTitle,
}: ResultPageProps) {
  const { t, i18n } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Container maxWidth="sm" component="main" sx={{ py: { xs: 5, sm: 8 } }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: '0.18em' }}
      >
        {t('finalResult.complete', { count: totalRounds })}
      </Typography>
      <Typography
        ref={headingRef}
        tabIndex={-1}
        component="h1"
        variant="h2"
        sx={{ mt: 1 }}
      >
        {t('finalResult.heading')}
      </Typography>
      <Box
        sx={{ my: 4, py: 4, borderBlock: '1px solid', borderColor: 'divider' }}
      >
        <Typography color="text.secondary">{t('finalResult.score')}</Typography>
        <Typography
          component="p"
          sx={{
            mt: 0.5,
            fontSize: { xs: 42, sm: 58 },
            fontWeight: 800,
            letterSpacing: '-.04em',
          }}
        >
          {totalScore.toLocaleString(i18n.language)}
          <Typography
            component="span"
            sx={{ ml: 1, fontSize: 18, color: 'text.secondary' }}
          >
            /{' '}
            {t('game.points', {
              value: maximumScore.toLocaleString(i18n.language),
            })}
          </Typography>
        </Typography>
      </Box>
      <ScoreList results={results} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 4 }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onReplay}
          sx={{ flex: 1 }}
        >
          {t('finalResult.replay')}
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={onTitle}
          sx={{ flex: 1 }}
        >
          {t('finalResult.title')}
        </Button>
      </Stack>
    </Container>
  );
}
