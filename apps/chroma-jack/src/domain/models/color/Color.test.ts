import { describe, expect, it } from 'vitest';
import { Color, ColorCreationFailure } from './Color';

describe('Color', () => {
  it('非負の整数から生成できる', () => {
    const color = Color.create(0, 255, 510);
    expect(color).toBeInstanceOf(Color);
    expect(color).toMatchObject({ red: 0, green: 255, blue: 510 });
  });

  it('整数でない値はenumで失敗理由を返す', () => {
    expect(Color.create(0.5, 0, 0)).toBe(ColorCreationFailure.NotInteger);
  });

  it('負の値はenumで失敗理由を返す', () => {
    expect(Color.create(-1, 0, 0)).toBe(ColorCreationFailure.NegativeChannel);
  });

  it('加算結果を新しい色として返し、元の色を変更しない', () => {
    const first = Color.create(10, 20, 30);
    const second = Color.create(1, 2, 3);
    expect(first).toBeInstanceOf(Color);
    expect(second).toBeInstanceOf(Color);
    if (!(first instanceof Color) || !(second instanceof Color)) return;

    expect(first.add(second)).toMatchObject({ red: 11, green: 22, blue: 33 });
    expect(first).toMatchObject({ red: 10, green: 20, blue: 30 });
  });
});
