import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';

// 同梱したJSON辞書をReactコンポーネントから同期的に利用できるよう初期化する。
void i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  supportedLngs: ['ja', 'en'],
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
