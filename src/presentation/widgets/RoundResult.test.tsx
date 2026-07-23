import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Color } from '../../domain/models/color/Color';
import { ColorChannel } from '../../domain/models/color/ColorChannel';
import type { RoundResult as RoundResultModel } from '../../domain/models/game/Round';
import { Hand } from '../../domain/models/hand/Hand';
import { ScoreTarget } from '../../domain/models/rules/ScorePolicy';
import { AppProviders } from '../providers/AppProviders';
import { RoundResult } from './RoundResult';
import {
  createRoundNumber,
  createRoundScore,
} from '../../test/helpers/createDomainValue';

function createHand(red: number, green: number, blue: number): Hand {
  const color = Color.create(red, green, blue);
  if (!(color instanceof Color)) throw new Error('Invalid test color');
  return new Hand(color);
}

function renderResult(
  result: RoundResultModel,
  scoreTarget = ScoreTarget.White,
) {
  render(
    <AppProviders>
      <RoundResult
        result={result}
        isLastRound={false}
        scoreTarget={scoreTarget}
        onContinue={vi.fn()}
      />
    </AppProviders>,
  );
}

describe('RoundResult', () => {
  it('通常終了後に確定した色の数値を表示する', () => {
    renderResult({
      roundNumber: createRoundNumber(1),
      finalHand: createHand(10, 20, 30),
      burstHand: null,
      burstChannels: null,
      score: createRoundScore(100),
      endReason: 'stood',
    });

    const values = screen.getByLabelText('確定した色の数値');
    expect(values).toHaveTextContent('R10');
    expect(values).toHaveTextContent('G20');
    expect(values).toHaveTextContent('B30');
  });

  it('バースト後にカード適用後の色の数値を表示する', () => {
    renderResult({
      roundNumber: createRoundNumber(1),
      finalHand: createHand(250, 10, 10),
      burstHand: createHand(256, 11, 11),
      burstChannels: [ColorChannel.Red],
      score: createRoundScore(0),
      endReason: 'burst',
    });

    const values = screen.getByLabelText(
      'カード適用後の色（バーストした値）の数値',
    );
    expect(values).toHaveTextContent('R256');
    expect(values).toHaveTextContent('G11');
    expect(values).toHaveTextContent('B11');
    expect(screen.getByText('1色バースト')).toBeInTheDocument();
  });

  it('CMY減算ルールでは確定色をCMY値で表示する', () => {
    renderResult(
      {
        roundNumber: createRoundNumber(1),
        finalHand: createHand(155, 235, 245),
        burstHand: null,
        burstChannels: null,
        score: createRoundScore(100),
        endReason: 'stood',
      },
      ScoreTarget.Black,
    );

    const values = screen.getByLabelText('確定した色の数値');
    expect(values).toHaveTextContent('C100');
    expect(values).toHaveTextContent('M20');
    expect(values).toHaveTextContent('Y10');
    expect(values).not.toHaveTextContent('R');
  });
});
