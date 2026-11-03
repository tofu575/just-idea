import { Color } from '../color/Color';
import type { Hand } from '../hand/Hand';
import type { OverflowPolicy } from '../rules/OverflowPolicy';
import { AddColorEffect } from './effects/AddColorEffect';
import type { CardEffect, CardEffectResult } from './effects/CardEffect';

// ゲームカードを生成できなかった理由を示す。
export enum GameCardCreationFailure {
  // カードを識別するIDが空である。
  EmptyId = 'emptyId',
  // 色成分がカードとして許可された範囲外である。
  InvalidChannel = 'invalidChannel',
  // すべての色成分が0で、効果のない黒いカードである。
  Black = 'black',
}

// 識別子と使用時に実行する効果だけを保持するカードモデル。
export class GameCard {
  static readonly MINIMUM_CHANNEL = 0;
  static readonly MAXIMUM_CHANNEL = 160;

  readonly id: string;
  readonly effect: CardEffect;

  // 検証済みの識別子とカード効果を保持する。
  private constructor(args: { id: string; effect: CardEffect }) {
    this.id = args.id;
    this.effect = args.effect;
  }

  // RGB加算カードの入力を検証し、カードまたは生成失敗理由を返す。
  static createAddColor(
    id: string,
    red: number,
    green: number,
    blue: number,
  ): GameCard | GameCardCreationFailure {
    if (id.trim().length === 0) return GameCardCreationFailure.EmptyId;
    const color = Color.create(red, green, blue);
    if (!(color instanceof Color))
      return GameCardCreationFailure.InvalidChannel;
    if (
      [color.red, color.green, color.blue].some(
        (channel) => channel > GameCard.MAXIMUM_CHANNEL,
      )
    ) {
      return GameCardCreationFailure.InvalidChannel;
    }
    if (color.isBlack()) return GameCardCreationFailure.Black;
    return new GameCard({ id, effect: new AddColorEffect(color) });
  }

  // 検証済みの特殊効果を持つカードを生成する。
  static createSpecial(args: {
    id: string;
    effect: Exclude<CardEffect, AddColorEffect>;
  }): GameCard | GameCardCreationFailure {
    if (args.id.trim().length === 0) return GameCardCreationFailure.EmptyId;
    return new GameCard(args);
  }

  // 保持する効果へ現在のラウンド条件とHandの変更処理を委譲する。
  applyTo(args: {
    hand: Hand;
    overflowPolicy: OverflowPolicy;
    canPreventBurst: boolean;
  }): CardEffectResult {
    return this.effect.applyTo(args);
  }
}
