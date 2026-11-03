// 色を生成できなかった理由を示す。
export enum ColorCreationFailure {
  // RGB成分のいずれかが安全な整数ではない。
  NotInteger = 'notInteger',
  // RGB成分のいずれかが負数である。
  NegativeChannel = 'negativeChannel',
}

// 上限を設けず、非負のRGB整数を保持する色のValue Object。
export class Color {
  readonly red: number;
  readonly green: number;
  readonly blue: number;

  // 検証済みのRGB成分を保持する色を組み立てる。
  private constructor(args: { red: number; green: number; blue: number }) {
    this.red = args.red;
    this.green = args.green;
    this.blue = args.blue;
  }

  // RGB成分を検証し、色または生成失敗理由を返す。
  static create(
    red: number,
    green: number,
    blue: number,
  ): Color | ColorCreationFailure {
    if (
      !Number.isSafeInteger(red) ||
      !Number.isSafeInteger(green) ||
      !Number.isSafeInteger(blue)
    ) {
      return ColorCreationFailure.NotInteger;
    }
    if (red < 0 || green < 0 || blue < 0) {
      return ColorCreationFailure.NegativeChannel;
    }
    return new Color({ red, green, blue });
  }

  // 2色の各成分を加算した新しい色を返す。
  add(other: Color): Color {
    const added = new Color({
      red: this.red + other.red,
      green: this.green + other.green,
      blue: this.blue + other.blue,
    });

    return added;
  }

  // すべての色成分が0かどうかを返す。
  isBlack(): boolean {
    return this.red === 0 && this.green === 0 && this.blue === 0;
  }
}
