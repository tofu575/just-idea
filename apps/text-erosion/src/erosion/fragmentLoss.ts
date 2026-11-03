import { connectedComponents } from "./connectedComponents";
import { hash } from "./noise";
import type { ErosionModel } from "./types";

// 昇順の時刻で小破片の脱落を焼き込む。一度落ちた領域は将来も背景になる。
export function bakeFragmentLoss(model: ErosionModel): void {
  const area = model.pixels.reduce((sum, value) => sum + value, 0);
  const remaining = new Uint8Array(model.pixels.length);
  for (let progress = 20; progress < 100; progress++) {
    for (let i = 0; i < remaining.length; i++)
      remaining[i] = model.pixels[i] && model.death[i] > progress ? 1 : 0;
    const limit = Math.max(4, area * 0.004) * (progress / 100) ** 1.5;
    for (const component of connectedComponents({
      ...model,
      pixels: remaining,
    })) {
      const anchor = component[0];
      const vulnerability =
        0.35 +
        0.65 *
          hash(
            anchor % model.width,
            Math.floor(anchor / model.width),
            model.seed + 3,
          );
      if (component.length <= limit * vulnerability) {
        for (const pixel of component) model.death[pixel] = progress;
      }
    }
  }
}
