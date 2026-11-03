import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import ja from './locales/ja.json';

// 入れ子のJSON辞書を比較可能な翻訳キー一覧へ変換する。
function collectTranslationKeys(
  dictionary: Record<string, unknown>,
  prefix = '',
): string[] {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const translationKey = prefix.length === 0 ? key : `${prefix}.${key}`;
    if (typeof value === 'string') return [translationKey];
    return collectTranslationKeys(
      value as Record<string, unknown>,
      translationKey,
    );
  });
}

describe('translation dictionaries', () => {
  it('日本語と英語で同じ翻訳キーを定義する', () => {
    expect(collectTranslationKeys(en).sort()).toEqual(
      collectTranslationKeys(ja).sort(),
    );
  });
});
