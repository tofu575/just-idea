import { distanceTransform } from "./distanceTransform";
import { neighbors } from "./connectedComponents";
import { bakeFragmentLoss } from "./fragmentLoss";
import { erosionNoise } from "./noise";
import { type Mask, type ErosionModel, validateMask } from "./types";

// 侵食境界を時刻の早い順に展開する最小ヒープ。
class Frontier {
  private entries: { index: number; time: number }[] = [];
  // 候補を追加し、親より早い時刻になる位置へ移す。
  push(entry: { index: number; time: number }): void {
    let i = this.entries.length;
    this.entries.push(entry);
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (this.entries[parent].time <= entry.time) break;
      this.entries[i] = this.entries[parent];
      i = parent;
    }
    this.entries[i] = entry;
  }
  // 最も早い候補を取り出し、残りの順序を復元する。
  pop(): { index: number; time: number } | undefined {
    const first = this.entries[0];
    const tail = this.entries.pop();
    if (!this.entries.length || !tail) return first;
    let i = 0;
    while (i * 2 + 1 < this.entries.length) {
      let child = i * 2 + 1;
      if (
        child + 1 < this.entries.length &&
        this.entries[child + 1].time < this.entries[child].time
      )
        child++;
      if (tail.time <= this.entries[child].time) break;
      this.entries[i] = this.entries[child];
      i = child;
    }
    this.entries[i] = tail;
    return first;
  }
}

// 境界からの到達時刻を計算し、孤立した内部ピクセルを先に除去しない。
export function createErosionModel(mask: Mask, seed: number): ErosionModel {
  validateMask(mask);
  if (!Number.isFinite(seed)) throw new RangeError("Seed must be finite");
  const distance = distanceTransform(mask);
  const times = new Float64Array(mask.pixels.length).fill(Infinity);
  const resistance = new Float32Array(mask.pixels.length);
  const frontier = new Frontier();
  for (let i = 0; i < mask.pixels.length; i++) {
    if (!mask.pixels[i]) continue;
    // 幅の狭い箇所は距離が小さく、連続ノイズの弱い領域から先に破断する。
    resistance[i] =
      distance[i] *
      (0.22 +
        1.65 * erosionNoise(i % mask.width, Math.floor(i / mask.width), seed));
    const adjacent = neighbors(i, mask.width, mask.height);
    if (adjacent.length < 4 || adjacent.some((next) => !mask.pixels[next])) {
      times[i] = resistance[i];
      frontier.push({ index: i, time: times[i] });
    }
  }
  let entry;
  let maximum = 0;
  while ((entry = frontier.pop())) {
    if (entry.time !== times[entry.index]) continue;
    maximum = Math.max(maximum, entry.time);
    for (const next of neighbors(entry.index, mask.width, mask.height)) {
      if (!mask.pixels[next]) continue;
      const time = Math.max(resistance[next], entry.time + 0.045);
      if (time < times[next]) {
        times[next] = time;
        frontier.push({ index: next, time });
      }
    }
  }
  const death = Uint8Array.from(times, (time, i) =>
    mask.pixels[i]
      ? Math.max(1, Math.min(100, Math.ceil(Math.sqrt(time / maximum) * 100)))
      : 0,
  );
  const model = { ...mask, pixels: mask.pixels.slice(), death, seed };
  bakeFragmentLoss(model);
  return model;
}

// 事前計算した消滅時刻を参照するだけなので、逆再生でも形状が一致する。
export function erode(model: ErosionModel, progress: number): Uint8Array {
  const clamped = Math.max(
    0,
    Math.min(100, Number.isFinite(progress) ? progress : 0),
  );
  return Uint8Array.from(model.pixels, (value, i) =>
    value && model.death[i] > clamped ? 1 : 0,
  );
}
