/** 物理と描画が共有する調整値。雨量は流速に影響しない。 */
export interface Settings {
  rain: number;
  gravity: number;
  adhesion: number;
  size: number;
  blur: number;
}

export const DEFAULT_SETTINGS: Settings = {
  rain: 1,
  gravity: 1,
  adhesion: 1,
  size: 1,
  blur: 1,
};

/** 体積を半径の三乗として扱う、ガラス上の水滴。 */
export interface Drop {
  id: number;
  x: number;
  y: number;
  volume: number;
  vx: number;
  vy: number;
  moving: boolean;
  pinning: number;
  growth: number;
  phase: number;
  age: number;
  shape: number;
}

/** 水膜の短い区間。経過時間に伴い屈折が弱まる。 */
export interface Trail {
  x: number;
  y: number;
  endX: number;
  endY: number;
  width: number;
  life: number;
}

/** 同じシードから同じ雨を作る軽量な乱数生成器。 */
export function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** 体積から接触半径の近似値を求める。 */
export function radius(drop: Drop): number {
  return Math.cbrt(drop.volume);
}
