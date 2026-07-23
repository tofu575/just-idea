import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Color } from '../../domain/models/color/Color';
import { ScoreTarget } from '../../domain/models/rules/ScorePolicy';

type ColorValueSummaryProps = {
  color: Color;
  label: string;
  target: ScoreTarget;
};

const RGB_CHANNELS = [
  { name: 'R', select: (color: Color) => color.red },
  { name: 'G', select: (color: Color) => color.green },
  { name: 'B', select: (color: Color) => color.blue },
] as const;

const CMY_CHANNELS = [
  { name: 'C', select: (color: Color) => 255 - color.red },
  { name: 'M', select: (color: Color) => 255 - color.green },
  { name: 'Y', select: (color: Color) => 255 - color.blue },
] as const;

// 選択中ルールの表記へ揃えた振り返り用の色成分値を表示する。
export function ColorValueSummary({
  color,
  label,
  target,
}: ColorValueSummaryProps) {
  const { t } = useTranslation();
  const channels = target === ScoreTarget.White ? RGB_CHANNELS : CMY_CHANNELS;
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        aria-label={t('roundResult.colorValues', { label })}
        sx={{ mt: 0.75 }}
      >
        {channels.map((channel) => (
          <Box
            key={channel.name}
            sx={{
              flex: 1,
              minWidth: 0,
              px: { xs: 1, sm: 1.5 },
              py: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {channel.name}
            </Typography>
            <Typography fontWeight={750}>{channel.select(color)}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
