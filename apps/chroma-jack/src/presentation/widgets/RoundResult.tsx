import { useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { RoundResult as RoundResultModel } from '../../domain/models/game/Round';
import { ColorValueSummary } from './ColorValueSummary';

type RoundResultProps = {
  result: RoundResultModel;
  isLastRound: boolean;
  onContinue: () => void;
};

// 終了理由、得点、確定色またはバースト後の値を表示する。
export function RoundResult({
  result,
  isLastRound,
  onContinue,
}: RoundResultProps) {
  const { t, i18n } = useTranslation();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const didBurst = result.endReason === 'burst';
  const resultColor = didBurst
    ? result.burstHand.color
    : result.finalHand.color;
  const endMessage =
    result.endReason === 'deckExhausted'
      ? t('roundResult.deckExhausted')
      : t('roundResult.stood');

  // 操作ボタンが消えた後も、支援技術がラウンド結果へ移動できるようにする。
  useEffect(() => {
    resultHeadingRef.current?.focus();
  }, []);

  return (
    <Box
      aria-live="polite"
      sx={{
        mt: 3,
        p: { xs: 2.5, sm: 3 },
        bgcolor: 'background.paper',
        borderRadius: 3,
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {t('roundResult.finished')}
      </Typography>
      <Typography
        ref={resultHeadingRef}
        variant="h4"
        component="h2"
        tabIndex={-1}
        sx={{ mt: 0.5 }}
      >
        {didBurst
          ? t('roundResult.burst')
          : t('game.points', {
              value: result.score.toLocaleString(i18n.language),
            })}
      </Typography>
      {!didBurst && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {endMessage}
        </Typography>
      )}
      {didBurst && (
        <>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('roundResult.burstCount', {
              count: result.burstChannels.length,
            })}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t('roundResult.burstDetail', {
              count: result.burstChannels.length,
            })}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            {t('game.points', { value: 0 })}
          </Typography>
        </>
      )}
      <ColorValueSummary
        color={resultColor}
        label={
          didBurst ? t('roundResult.burstColor') : t('roundResult.finalColor')
        }
      />
      <Button
        variant="contained"
        size="large"
        onClick={onContinue}
        sx={{ mt: 3 }}
      >
        {isLastRound
          ? t('roundResult.viewResults')
          : t('roundResult.nextRound')}
      </Button>
    </Box>
  );
}
