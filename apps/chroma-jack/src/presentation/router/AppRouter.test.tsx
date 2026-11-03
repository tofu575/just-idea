import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GameRules } from '../../domain/models/rules/GameRules';
import { AppProviders } from '../providers/AppProviders';
import { AppRouter } from './AppRouter';

function renderApp() {
  return render(
    <AppProviders>
      <AppRouter />
    </AppProviders>,
  );
}

describe('App', () => {
  it('表示言語を英語へ切り替える', async () => {
    const user = userEvent.setup();
    renderApp();

    const languageSelect = screen.getByRole('combobox', {
      name: '表示言語',
    });
    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: 'English' }));

    expect(
      screen.getByRole('button', { name: 'Start game' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Game rules' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    await user.click(screen.getByRole('button', { name: 'Start game' }));
    expect(screen.getByLabelText('Current color')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Use choice 1/ }),
    ).toBeInTheDocument();
  });

  it('Classicを初期選択し、開始前にClamp Challengeへ変更できる', async () => {
    const user = userEvent.setup();
    renderApp();

    const rulesSelect = screen.getByRole('combobox', {
      name: 'ゲームルール',
    });
    expect(rulesSelect).toHaveTextContent('Classic');

    await user.click(rulesSelect);
    await user.click(screen.getByRole('option', { name: 'Clamp Challenge' }));

    expect(rulesSelect).toHaveTextContent('Clamp Challenge');
    expect(
      screen.getByText(/1色までバーストしても上限で止まり/),
    ).toBeInTheDocument();
    expect(rulesSelect).toHaveAttribute(
      'aria-describedby',
      'game-rules-description',
    );
    expect(screen.getByText(/得点上限が下がります/)).toBeInTheDocument();
  });

  it('親が再描画されてもプレイヤーが選んだルールを維持する', async () => {
    const user = userEvent.setup();
    const view = render(
      <AppProviders>
        <AppRouter initialRules={GameRules.classic()} />
      </AppProviders>,
    );
    const rulesSelect = screen.getByRole('combobox', {
      name: 'ゲームルール',
    });
    await user.click(rulesSelect);
    await user.click(screen.getByRole('option', { name: 'Clamp Challenge' }));

    view.rerender(
      <AppProviders>
        <AppRouter initialRules={GameRules.classic()} />
      </AppProviders>,
    );

    expect(rulesSelect).toHaveTextContent('Clamp Challenge');
  });

  it('開始画面からゲームを始め、候補色と2操作を表示する', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'ゲームを始める' }));

    expect(screen.getByLabelText('現在の色')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /候補 1を使う/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '選んだ色を加える' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '候補をすべて捨てる' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ここで止める' }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/#[0-9a-f]{6}/i);
    expect(document.body.textContent).not.toMatch(/RGB\s*\(/i);
    expect(screen.queryByLabelText(/色の数値/)).not.toBeInTheDocument();
  });

  it('Clamp Challengeでは3枚から選んだ1枚を使う', async () => {
    const user = userEvent.setup();
    renderApp();
    const rulesSelect = screen.getByRole('combobox', {
      name: 'ゲームルール',
    });
    await user.click(rulesSelect);
    await user.click(screen.getByRole('option', { name: 'Clamp Challenge' }));
    await user.click(screen.getByRole('button', { name: 'ゲームを始める' }));

    expect(
      screen.getByRole('button', { name: /候補 1を使う/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /候補 2を使う/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /候補 3を使う/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /候補 2を使う/ }));
    expect(screen.getByText('21枚')).toBeInTheDocument();
  });

  it('途中で止めた場合は未使用カードの残数を保つ', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'ゲームを始める' }));
    await user.click(screen.getByRole('button', { name: 'ここで止める' }));

    expect(screen.getByText('12枚')).toBeInTheDocument();
    expect(screen.getByText('ラウンド終了')).toBeInTheDocument();
    expect(screen.getByLabelText('確定した色の数値')).toBeInTheDocument();
  });

  it('5ラウンドを終えて結果を表示し、もう一度遊べる', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'ゲームを始める' }));

    for (let round = 1; round <= 5; round += 1) {
      await user.click(screen.getByRole('button', { name: 'ここで止める' }));
      const nextLabel = round === 5 ? '結果を見る' : '次のラウンドへ';
      await user.click(screen.getByRole('button', { name: nextLabel }));
    }

    expect(
      screen.getByRole('heading', { name: 'ゲーム終了' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('各ラウンドのスコア').children).toHaveLength(
      5,
    );
    await user.click(screen.getByRole('button', { name: 'もう一度遊ぶ' }));
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });
});
