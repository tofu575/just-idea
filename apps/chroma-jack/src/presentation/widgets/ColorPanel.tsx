import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Color } from '../../domain/models/color/Color';

type ColorPanelProps = {
  color: Color;
};

// Domainの色をブラウザで描画できるCSSカラーへ変換する。
function toCssColor(color: Color): string {
  return `rgb(${color.red}, ${color.green}, ${color.blue})`;
}

// プレイヤーが現在保持している色を最も大きな色面として表示する。
export function ColorPanel({ color }: ColorPanelProps) {
  const { t } = useTranslation();
  return (
    <Box sx={{ flex: 1.65, minWidth: 0 }}>
      <Typography
        component="h2"
        variant="overline"
        sx={{ color: 'text.secondary', letterSpacing: '0.14em' }}
      >
        {t('game.currentColor')}
      </Typography>
      <Box
        role="img"
        aria-label={t('game.currentColor')}
        sx={{
          mt: 0.5,
          width: '100%',
          height: { xs: 180, sm: 300, md: 360 },
          bgcolor: toCssColor(color),
          border: '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: 3,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.08)',
          transition: 'background-color 320ms ease',
        }}
      />
    </Box>
  );
}
