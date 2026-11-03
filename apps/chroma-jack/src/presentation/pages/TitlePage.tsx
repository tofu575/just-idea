import { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SelectableGameRule } from '../rules/SelectableGameRule';

type TitlePageProps = {
  ruleOptions: readonly SelectableGameRule[];
  selectedRulesId: string;
  onSelectRules: (rulesId: string) => void;
  onStart: () => void;
};

// ゲーム概要と開始操作を提示するタイトル画面。
export function TitlePage({
  ruleOptions,
  selectedRulesId,
  onSelectRules,
  onStart,
}: TitlePageProps) {
  const { t, i18n } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedRule =
    ruleOptions.find((option) => option.rules.id === selectedRulesId) ??
    ruleOptions[0];
  if (selectedRule === undefined) {
    throw new RangeError('At least one selectable game rule is required.');
  }
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ja';

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // 選択中の言語を文書全体の言語属性にも反映する。
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <Container maxWidth="md">
      <Stack
        component="main"
        minHeight="100dvh"
        justifyContent="center"
        alignItems="flex-start"
        sx={{ py: 6 }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: { xs: 72, sm: 92 },
            aspectRatio: '1',
            mb: 4,
            borderRadius: '50%',
            background:
              'conic-gradient(from 30deg, #ff5e5b, #ffd166, #54c487, #38a3db, #7768d8, #ff5e5b)',
            border: '1px solid rgba(0,0,0,.15)',
          }}
        />
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: '0.2em', mb: 1 }}
        >
          Trust your eyes
        </Typography>
        <Typography
          ref={headingRef}
          tabIndex={-1}
          component="h1"
          variant="h1"
          sx={{ fontSize: { xs: 56, sm: 86 } }}
        >
          Chroma Jack
        </Typography>
        <Typography
          id="game-rules-description"
          component="p"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          sx={{
            mt: 3,
            maxWidth: 500,
            fontSize: { xs: 18, sm: 21 },
            lineHeight: 1.9,
          }}
        >
          {t('title.tagline')}
          <br />
          {t(selectedRule.descriptionKey, {
            defaultValue: t('rules.custom.description'),
          })}
          <br />
          {t('title.trust')}
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mt: 4, width: { xs: '100%', sm: 'auto' } }}
        >
          <FormControl sx={{ minWidth: { xs: '100%', sm: 280 } }}>
            <InputLabel id="game-rules-label">
              {t('title.rulesLabel')}
            </InputLabel>
            <Select
              labelId="game-rules-label"
              value={selectedRulesId}
              label={t('title.rulesLabel')}
              inputProps={{ 'aria-describedby': 'game-rules-description' }}
              onChange={(event: SelectChangeEvent) =>
                onSelectRules(event.target.value)
              }
            >
              {ruleOptions.map((option) => (
                <MenuItem key={option.rules.id} value={option.rules.id}>
                  {t(option.labelKey, { defaultValue: option.rules.id })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel id="language-label">{t('language.label')}</InputLabel>
            <Select
              labelId="language-label"
              value={language}
              label={t('language.label')}
              onChange={(event: SelectChangeEvent) => {
                void i18n.changeLanguage(event.target.value);
              }}
            >
              <MenuItem value="ja">{t('language.ja')}</MenuItem>
              <MenuItem value="en">{t('language.en')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Button
          variant="contained"
          size="large"
          onClick={onStart}
          sx={{ mt: 3, minWidth: 210 }}
        >
          {t('title.start')}
        </Button>
      </Stack>
    </Container>
  );
}
