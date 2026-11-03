// 行優先の二値マスク。背景を0、文字を1で表す。
export interface Mask {
  width: number;
  height: number;
  pixels: Uint8Array;
}
// 各ピクセルが失われる進行度を保存し、スライダー操作で再計算しない。
export interface ErosionModel extends Mask {
  death: Uint8Array;
  seed: number;
}
// 不正なサイズや画素をアルゴリズムの入口で拒否する。
export function validateMask(mask: Mask): void {
  if (
    !Number.isInteger(mask.width) ||
    !Number.isInteger(mask.height) ||
    mask.width < 0 ||
    mask.height < 0 ||
    mask.width * mask.height !== mask.pixels.length ||
    mask.pixels.some((value) => value !== 0 && value !== 1)
  ) {
    throw new RangeError("Invalid binary mask");
  }
}
