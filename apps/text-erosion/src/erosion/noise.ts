// 座標とシードから安定した0〜1の値を得る。格子点・破片の判定にのみ使用する。
export function hash(x: number, y: number, seed: number): number {
  let value = Math.imul(x ^ seed, 374761393) ^ Math.imul(y, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}
// 格子間を滑らかに補間し、独立したピクセル乱数による穴を避ける。
function valueNoise(x: number, y: number, seed: number): number {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const dx = x - left;
  const dy = y - top;
  const u = dx * dx * (3 - 2 * dx);
  const v = dy * dy * (3 - 2 * dy);
  const a = hash(left, top, seed) * (1 - u) + hash(left + 1, top, seed) * u;
  const b =
    hash(left, top + 1, seed) * (1 - u) + hash(left + 1, top + 1, seed) * u;
  return a * (1 - v) + b * v;
}
// 大きな局所欠損と細かな縁の荒れを、3つの連続したスケールで重ねる。
export function erosionNoise(x: number, y: number, seed: number): number {
  return (
    0.55 * valueNoise(x / 36, y / 36, seed) +
    0.3 * valueNoise(x / 12, y / 12, seed + 1) +
    0.15 * valueNoise(x / 4, y / 4, seed + 2)
  );
}
