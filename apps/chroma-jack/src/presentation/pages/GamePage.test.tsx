import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Color } from '../../domain/models/color/Color';
import { ColorChannel } from '../../domain/models/color/ColorChannel';
import { GameCard } from '../../domain/models/card/GameCard';
import type { GameState } from '../../domain/models/game/Game';
import { GameRound } from '../../domain/models/game/GameRound';
import { Hand } from '../../domain/models/hand/Hand';
import { AppProviders } from '../providers/AppProviders';
import { GamePage } from './GamePage';

// 継続可能なバースト後のプレイ状態を生成する。
function createContinuedGame(revealsColorValues = false): GameState {
  const color = Color.create(255, 100, 100);
  const card = GameCard.createAddColor('next', 1, 1, 1);
  if (!(color instanceof Color) || !(card instanceof GameCard)) {
    throw new RangeError('Invalid test game values.');
  }
  return {
    phase: 'playing',
    currentRound: new GameRound({
      roundNumber: 1,
      hand: new Hand(color, new Set([ColorChannel.Red])),
      offeredCards: [card],
      remainingDeck: [],
      revealsColorValues,
    }),
    roundResults: [],
  };
}

describe('GamePage', () => {
  it('継続可能なバースト後に累計バースト色数を表示する', () => {
    render(
      <AppProviders>
        <GamePage
          game={createContinuedGame()}
          totalRounds={5}
          totalScore={0}
          onAccept={vi.fn()}
          onDiscard={vi.fn()}
          onStand={vi.fn()}
          onContinue={vi.fn()}
        />
      </AppProviders>,
    );

    expect(
      screen.getByText('1色バースト・上限の色で続行します'),
    ).toBeInTheDocument();
  });

  it('数値表示が解禁されたラウンドでは現在のRGB値を表示する', () => {
    render(
      <AppProviders>
        <GamePage
          game={createContinuedGame(true)}
          totalRounds={5}
          totalScore={0}
          onAccept={vi.fn()}
          onDiscard={vi.fn()}
          onStand={vi.fn()}
          onContinue={vi.fn()}
        />
      </AppProviders>,
    );

    expect(
      screen.getByLabelText('カード効果で解禁された現在値の数値'),
    ).toBeInTheDocument();
  });
});
