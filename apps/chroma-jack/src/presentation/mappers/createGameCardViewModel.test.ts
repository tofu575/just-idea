import { describe, expect, it } from 'vitest';
import { GameCard } from '../../domain/models/card/GameCard';
import { PreventBurstEffect } from '../../domain/models/card/effects/RoundModifierEffects';
import { AdjustColorEffect } from '../../domain/models/card/effects/AdjustColorEffect';
import { createGameCardViewModel } from './createGameCardViewModel';

describe('createGameCardViewModel', () => {
  it('加算効果のamountをカード面の色へ変換する', () => {
    const card = GameCard.createAddColor('add', 10, 20, 30);
    if (!(card instanceof GameCard)) return;

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.backgroundColor).toBe('rgb(10, 20, 30)');
    expect(viewModel.titleKey).toBe('cards.addColor');
  });

  it('特殊効果をPresentation固有の色と模様へ変換する', () => {
    const card = GameCard.createSpecial({
      id: 'prevent',
      effect: new PreventBurstEffect(),
    });
    if (!(card instanceof GameCard)) return;

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.titleKey).toBe('cards.preventBurst');
    expect(viewModel.backgroundImage).toBeDefined();
  });

  it('複数成分を逆方向へ動かす効果を増加と減少に分ける', () => {
    const card = GameCard.createSpecial({
      id: 'mixed-adjustment',
      effect: new AdjustColorEffect({ red: 20, green: -30, blue: 0 }),
    });
    if (!(card instanceof GameCard)) return;

    const viewModel = createGameCardViewModel(card);

    expect(viewModel.titleKey).toBe(
      'cards.details.adjustChannelsBothDirections',
    );
    expect(viewModel.titleValues).toEqual({ increase: 'R', decrease: 'G' });
  });
});
