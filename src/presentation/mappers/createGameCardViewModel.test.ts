import { describe, expect, it } from 'vitest';
import { AdjustColorEffect } from '../../domain/models/card/effects/AdjustColorEffect';
import { PreventBurstEffect } from '../../domain/models/card/effects/RoundModifierEffects';
import {
  createAddColorCard,
  createColorAdjustment,
  createEffectCard,
  createSubtractColorCard,
} from '../../test/helpers/createDomainValue';
import { createGameCardViewModel } from './createGameCardViewModel';

describe('createGameCardViewModel', () => {
  it('加算効果のamountをカード面の色へ変換する', () => {
    const card = createAddColorCard('add', 10, 20, 30);

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.backgroundColor).toBe('rgb(10, 20, 30)');
    expect(viewModel.titleKey).toBe('cards.addColor');
    expect(viewModel.componentHints).toEqual([
      { channel: 'R', strength: 1 },
      { channel: 'G', strength: 2 },
      { channel: 'B', strength: 3 },
    ]);
  });

  it('CMY減算量をカード面のRGB色へ変換する', () => {
    const card = createSubtractColorCard('subtract', 100, 20, 10);

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.backgroundColor).toBe('rgb(155, 235, 245)');
    expect(viewModel.titleKey).toBe('cards.subtractColor');
    expect(viewModel.componentHints).toEqual([
      { channel: 'C', strength: 3 },
      { channel: 'M', strength: 1 },
      { channel: 'Y', strength: 1 },
    ]);
  });

  it('特殊効果をPresentation固有の色と模様へ変換する', () => {
    const card = createEffectCard('prevent', new PreventBurstEffect());

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.titleKey).toBe('cards.preventBurst');
    expect(viewModel.backgroundImage).toBeDefined();
  });

  it('複数成分を逆方向へ動かす効果を増加と減少に分ける', () => {
    const card = createEffectCard(
      'mixed-adjustment',
      new AdjustColorEffect(
        createColorAdjustment({ red: 20, green: -30, blue: 0 }),
      ),
    );

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.titleKey).toBe(
      'cards.details.adjustChannelsBothDirections',
    );
    expect(viewModel.titleValues).toEqual({ increase: 'R', decrease: 'G' });
  });
});
