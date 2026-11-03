// RGBのどの色成分を扱うかを示す。
export enum ColorChannel {
  // 赤成分。
  Red = 'red',
  // 緑成分。
  Green = 'green',
  // 青成分。
  Blue = 'blue',
}

// RGB成分を決まった順序で処理するための一覧。
export const COLOR_CHANNELS = [
  ColorChannel.Red,
  ColorChannel.Green,
  ColorChannel.Blue,
] as const;
