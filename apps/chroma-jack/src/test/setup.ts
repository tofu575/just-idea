import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import i18n from '../presentation/i18n/i18n';

// 各テストを既定の日本語表示から開始し、言語選択の影響を分離する。
beforeEach(async () => {
  await i18n.changeLanguage('ja');
});
