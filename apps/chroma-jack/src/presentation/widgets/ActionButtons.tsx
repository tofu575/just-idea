import { Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

type ActionButtonsProps = {
  onDiscard: () => void;
  onStand: () => void;
};

// 公開候補をまとめて破棄する操作と、現在色で停止する操作を表示する。
export function ActionButtons({ onDiscard, onStand }: ActionButtonsProps) {
  const { t } = useTranslation();
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
      <Button
        variant="contained"
        size="large"
        onClick={onDiscard}
        sx={{ flex: 1 }}
      >
        {t('game.discard')}
      </Button>
      <Button variant="text" size="large" onClick={onStand} sx={{ flex: 1 }}>
        {t('game.stand')}
      </Button>
    </Stack>
  );
}
