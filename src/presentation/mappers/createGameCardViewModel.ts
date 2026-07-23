import type { GameCard } from '../../domain/models/card/GameCard';
import type { CardColorAmount } from '../../domain/models/card/CardColorAmount';
import { CardEffectKind } from '../../domain/models/card/effects/CardEffect';
import type {
  CardComponentHint,
  GameCardViewModel,
} from '../models/GameCardViewModel';

type ComponentLabels = Readonly<{
  red: CardComponentHint['channel'];
  green: CardComponentHint['channel'];
  blue: CardComponentHint['channel'];
}>;

// 最大成分との比率から、カード内の各成分を3段階の相対強度へ変換する。
function createComponentHints(
  amount: CardColorAmount,
  labels: ComponentLabels,
): readonly CardComponentHint[] {
  const components = [
    { channel: labels.red, amount: amount.red },
    { channel: labels.green, amount: amount.green },
    { channel: labels.blue, amount: amount.blue },
  ].filter((component) => component.amount > 0);
  const maximumAmount = Math.max(
    ...components.map((component) => component.amount),
  );

  return components.map((component) => ({
    channel: component.channel,
    strength:
      component.amount === maximumAmount
        ? 3
        : component.amount * 2 >= maximumAmount
          ? 2
          : 1,
  }));
}

// 未対応Effectをコンパイル時と実行時の両方で検出する。
function assertNever(value: never): never {
  throw new RangeError(`Unsupported card effect: ${value}`);
}

// Domainのカード効果をPresentation専用の文言キーと装飾へ変換する。
export function createGameCardViewModel(card: GameCard): GameCardViewModel {
  const effect = card.effect;
  switch (effect.kind) {
    case CardEffectKind.AddColor:
      return {
        id: card.id,
        titleKey: 'cards.addColor',
        backgroundColor: `rgb(${effect.amount.color.red}, ${effect.amount.color.green}, ${effect.amount.color.blue})`,
        componentHints: createComponentHints(effect.amount, {
          red: 'R',
          green: 'G',
          blue: 'B',
        }),
      };
    case CardEffectKind.SubtractColor:
      return {
        id: card.id,
        titleKey: 'cards.subtractColor',
        backgroundColor: `rgb(${255 - effect.amount.color.red}, ${255 - effect.amount.color.green}, ${255 - effect.amount.color.blue})`,
        componentHints: createComponentHints(effect.amount, {
          red: 'C',
          green: 'M',
          blue: 'Y',
        }),
      };
    case CardEffectKind.AdjustChannels: {
      const changes = Object.entries(effect.delta).filter(
        ([, value]) => value !== 0,
      );
      const increasedChannels = changes
        .filter(([, value]) => value > 0)
        .map(([channel]) => channel[0]?.toUpperCase());
      const decreasedChannels = changes
        .filter(([, value]) => value < 0)
        .map(([channel]) => channel[0]?.toUpperCase());
      const changesBothDirections =
        increasedChannels.length > 0 && decreasedChannels.length > 0;
      return {
        id: card.id,
        titleKey: changesBothDirections
          ? 'cards.details.adjustChannelsBothDirections'
          : increasedChannels.length > 0
            ? 'cards.details.increaseChannels'
            : 'cards.details.decreaseChannels',
        titleValues: changesBothDirections
          ? {
              increase: increasedChannels.join('/'),
              decrease: decreasedChannels.join('/'),
            }
          : {
              channel: [...increasedChannels, ...decreasedChannels].join('/'),
            },
        backgroundColor: '#334155',
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 12px, rgba(255,255,255,.16) 12px 24px)',
      };
    }
    case CardEffectKind.SwapChannels:
      return {
        id: card.id,
        titleKey: 'cards.details.swapChannels',
        titleValues: {
          first: effect.first.toUpperCase(),
          second: effect.second.toUpperCase(),
        },
        backgroundColor: '#7e22ce',
        backgroundImage:
          'linear-gradient(135deg, rgba(255,255,255,.25), transparent 55%)',
      };
    case CardEffectKind.AdjustSaturation:
      return {
        id: card.id,
        titleKey:
          effect.percentage > 100
            ? 'cards.details.increaseSaturation'
            : 'cards.details.decreaseSaturation',
        backgroundColor: '#be185d',
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,.35) 0 10%, transparent 11% 100%)',
      };
    case CardEffectKind.AdjustBrightness:
      return {
        id: card.id,
        titleKey:
          effect.amount > 0
            ? 'cards.details.increaseBrightness'
            : 'cards.details.decreaseBrightness',
        backgroundColor: '#ca8a04',
        backgroundImage:
          'radial-gradient(circle at center, rgba(255,255,255,.7), transparent 55%)',
      };
    case CardEffectKind.RevealColorValues:
      return {
        id: card.id,
        titleKey: 'cards.revealColorValues',
        backgroundColor: '#b45309',
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px)',
      };
    case CardEffectKind.PreventBurst:
      return {
        id: card.id,
        titleKey: 'cards.preventBurst',
        backgroundColor: '#15803d',
        backgroundImage:
          'radial-gradient(circle at center, transparent 0 30%, rgba(255,255,255,.22) 31% 38%, transparent 39%)',
      };
    default:
      return assertNever(effect);
  }
}
