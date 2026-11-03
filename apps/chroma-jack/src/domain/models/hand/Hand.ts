import { Color } from '../color/Color';
import { COLOR_CHANNELS, type ColorChannel } from '../color/ColorChannel';
import type { OverflowPolicy } from '../rules/OverflowPolicy';

// カード加算後にラウンドを継続できるかを示す。
export enum HandAdditionStatus {
  // 加算を反映し、ラウンドを継続できる。
  Added = 'added',
  // 終了対象の成分が上限を超え、ラウンドが終了する。
  Burst = 'burst',
}

// カード加算後の手札と超過した成分をまとめた結果。
export type HandAddition = Readonly<{
  status: HandAdditionStatus;
  hand: Hand;
  overflowedChannels: readonly ColorChannel[];
}>;

// 現在色とクランプ履歴を保持し、カード加算ルールを実行するモデル。
export class Hand {
  static readonly CHANNEL_LIMIT = 255;
  private readonly clampedChannelSet: ReadonlySet<ColorChannel>;

  // 現在色とクランプ履歴から手札を組み立てる。
  constructor(
    readonly color: Color, // readonlyをつけると、暗黙的にメンバ変数としても定義される
    clampedChannels: ReadonlySet<ColorChannel> = new Set(),
  ) {
    // NOTE: 直接変更されないように、クランプ済み成分をコピーして保持する。
    // Defensive Copy（防御的コピー）
    this.clampedChannelSet = new Set(clampedChannels);
  }

  // クランプ済み成分を外部変更できないコピーとして返す。
  get clampedChannels(): ReadonlySet<ColorChannel> {
    return new Set(this.clampedChannelSet);
  }

  // Policyに従って色を加算し、継続またはバースト結果を返す。
  addColor(amount: Color, overflowPolicy: OverflowPolicy): HandAddition {
    return this.changeColor(this.color.add(amount), overflowPolicy);
  }

  // Policyに従って次の色へ変更し、継続またはバースト結果を返す。
  changeColor(
    attemptedColor: Color,
    overflowPolicy: OverflowPolicy,
    preventBurst = false,
  ): HandAddition {
    const overflowedChannels = COLOR_CHANNELS.filter(
      (channel) => attemptedColor[channel] > Hand.CHANNEL_LIMIT,
    );
    const burstChannels = new Set(this.clampedChannelSet);
    overflowedChannels.forEach((channel) => burstChannels.add(channel));
    const attemptedHand = new Hand(attemptedColor, burstChannels);
    const endsRound =
      overflowedChannels.length > 0 &&
      !preventBurst &&
      !overflowPolicy.canContinueWith(burstChannels.size);

    if (endsRound) {
      return {
        status: HandAdditionStatus.Burst,
        hand: attemptedHand,
        overflowedChannels,
      };
    }

    const resolvedColor = Color.create(
      Math.min(Hand.CHANNEL_LIMIT, attemptedColor.red),
      Math.min(Hand.CHANNEL_LIMIT, attemptedColor.green),
      Math.min(Hand.CHANNEL_LIMIT, attemptedColor.blue),
    );
    if (!(resolvedColor instanceof Color)) {
      throw new RangeError(`Invalid resolved color: ${resolvedColor}`);
    }
    return {
      status: HandAdditionStatus.Added,
      hand: new Hand(resolvedColor, burstChannels),
      overflowedChannels,
    };
  }
}
