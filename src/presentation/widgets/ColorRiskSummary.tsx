import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Color } from '../../domain/models/color/Color';
import type { ScoreTarget } from '../../domain/models/rules/ScorePolicy';
import { createColorRiskViewModel } from '../mappers/createColorRiskViewModel';
import { ColorRiskLevel } from '../models/ColorRiskViewModel';

type ColorRiskSummaryProps = {
  color: Color;
  target: ScoreTarget;
};

const RISK_SYMBOLS: Readonly<Record<ColorRiskLevel, string>> = {
  [ColorRiskLevel.Safe]: '○',
  [ColorRiskLevel.Risk]: '△',
  [ColorRiskLevel.Danger]: '!',
};

// 選択中ルールの色成分が境界へどの程度近いかを数値なしで表示する。
export function ColorRiskSummary({ color, target }: ColorRiskSummaryProps) {
  const { t } = useTranslation();
  const channelRisks = createColorRiskViewModel(color, target);

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        component="h2"
        variant="overline"
        sx={{ color: 'text.secondary', letterSpacing: '0.14em' }}
      >
        {t('game.channelRisk.heading')}
      </Typography>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        {channelRisks.map((risk) => (
          <Stack
            key={risk.channel}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            spacing={{ xs: 0.25, sm: 0.75 }}
            sx={{
              flex: 1,
              minWidth: 0,
              px: { xs: 1, sm: 1.5 },
              py: 0.75,
              border: '1px solid',
              borderColor:
                risk.level === ColorRiskLevel.Danger
                  ? 'warning.main'
                  : 'divider',
              borderRadius: 2,
              bgcolor:
                risk.level === ColorRiskLevel.Danger
                  ? 'warning.light'
                  : 'background.paper',
            }}
          >
            <Typography component="span" fontWeight={800} whiteSpace="nowrap">
              {risk.channel}
              <Box component="span" aria-hidden="true" sx={{ ml: 0.75 }}>
                {RISK_SYMBOLS[risk.level]}
              </Box>
            </Typography>
            <Typography
              component="span"
              variant="caption"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t(`game.channelRisk.${risk.level}`)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
