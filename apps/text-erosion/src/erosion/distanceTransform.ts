import { type Mask, validateMask } from "./types";

// 放物線の下包絡線を使い、一次元の二乗ユークリッド距離を線形時間で求める。
function transformLine(input: Float64Array): Float64Array {
  const length = input.length;
  const sites = new Int32Array(length);
  const edges = new Float64Array(length + 1);
  const output = new Float64Array(length);
  let last = 0;
  edges[0] = -Infinity;
  edges[1] = Infinity;
  for (let q = 1; q < length; q++) {
    let split: number;
    do {
      const v = sites[last];
      split = (input[q] + q * q - (input[v] + v * v)) / (2 * (q - v));
      if (split > edges[last]) break;
      last--;
    } while (last >= 0);
    last++;
    sites[last] = q;
    edges[last] = split;
    edges[last + 1] = Infinity;
  }
  last = 0;
  for (let q = 0; q < length; q++) {
    while (edges[last + 1] < q) last++;
    output[q] = (q - sites[last]) ** 2 + input[sites[last]];
  }
  return output;
}

// 外側に背景を1px追加し、全面が文字のマスクでも輪郭からの距離を返す。
export function distanceTransform(mask: Mask): Float32Array {
  validateMask(mask);
  const width = mask.width + 2;
  const height = mask.height + 2;
  const squared = new Float64Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      squared[y * width + x] = mask.pixels[(y - 1) * mask.width + x - 1]
        ? 1e12
        : 0;
    }
  }
  for (let y = 0; y < height; y++)
    squared.set(
      transformLine(squared.slice(y * width, (y + 1) * width)),
      y * width,
    );
  const distances = new Float32Array(mask.pixels.length);
  for (let x = 1; x < width - 1; x++) {
    const column = Float64Array.from(
      { length: height },
      (_, y) => squared[y * width + x],
    );
    const result = transformLine(column);
    for (let y = 1; y < height - 1; y++)
      distances[(y - 1) * mask.width + x - 1] = Math.sqrt(result[y]);
  }
  return distances;
}
