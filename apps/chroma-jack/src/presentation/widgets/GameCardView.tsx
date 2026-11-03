import { Box, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GameCardViewModel } from '../models/GameCardViewModel';

type GameCardViewProps = {
  card: GameCardViewModel;
  label: string;
  actionLabel: string;
  onAccept: () => void;
};

// 表示用モデルに解決済みのカード面と選択操作を描画する。
export function GameCardView({
  card,
  label,
  actionLabel,
  onAccept,
}: GameCardViewProps) {
  const { t } = useTranslation();
  const effectTitle = t(card.titleKey, card.titleValues);
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {effectTitle}
      </Typography>
      <ButtonBase
        aria-label={`${actionLabel}: ${effectTitle}`}
        onClick={onAccept}
        sx={{
          mt: 0.5,
          width: '100%',
          height: { xs: 112, sm: 160, md: 190 },
          bgcolor: card.backgroundColor,
          backgroundImage: card.backgroundImage,
          backgroundSize: '24px 24px',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: 3,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.07)',
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: 3,
          },
        }}
      />
    </Box>
  );
}
