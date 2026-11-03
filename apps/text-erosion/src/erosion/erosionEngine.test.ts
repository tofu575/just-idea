import { describe, expect, it } from "vitest";
import { createErosionModel, erode } from "./erosionEngine";
import { bakeFragmentLoss } from "./fragmentLoss";
import { distanceTransform } from "./distanceTransform";
import { connectedComponents, neighbors } from "./connectedComponents";
import { erosionNoise } from "./noise";
import type { Mask } from "./types";

// 人工の二値形状でフォント・Canvasから独立して風化の性質を検証する。
function shape(rows: string[]): Mask {
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    pixels: Uint8Array.from(rows.join(""), (c) => (c === "#" ? 1 : 0)),
  };
}
const block = shape(Array.from({ length: 25 }, () => "#".repeat(35)));

// 初期背景と画像外部から、現在の背景を四近傍でたどれるか調べる。
function expectBoundaryConnected(mask: Mask, remaining: Uint8Array): void {
  const seen = new Uint8Array(remaining.length);
  const queue: number[] = [];
  for (let i = 0; i < remaining.length; i++) {
    if (
      !remaining[i] &&
      (!mask.pixels[i] || neighbors(i, mask.width, mask.height).length < 4)
    ) {
      queue.push(i);
      seen[i] = 1;
    }
  }
  for (let head = 0; head < queue.length; head++) {
    for (const next of neighbors(queue[head], mask.width, mask.height)) {
      if (!remaining[next] && !seen[next]) {
        seen[next] = 1;
        queue.push(next);
      }
    }
  }
  for (let i = 0; i < remaining.length; i++)
    if (mask.pixels[i] && !remaining[i]) expect(seen[i]).toBe(1);
}

describe("contour-driven erosion", () => {
  it("preserves every original pixel at 0%, and copies the input", () => {
    const mask = shape(["..###..", ".#####.", "..###.."]);
    const model = createErosionModel(mask, 42);
    expect(erode(model, 0)).toEqual(mask.pixels);
    model.pixels[0] = 1;
    expect(mask.pixels[0]).toBe(0);
  });
  it("reproduces a seed and restores exact earlier states after scrubbing", () => {
    const a = createErosionModel(block, 73);
    const b = createErosionModel(block, 73);
    const earlier = erode(a, 25);
    erode(a, 90);
    expect(erode(a, 25)).toEqual(earlier);
    expect(a.death).toEqual(b.death);
    expect(erode(a, 50)).toEqual(erode(b, 50));
  });
  it("never restores removed pixels at any integer progress", () => {
    for (const seed of [0, 7, 2026, 4294967295]) {
      const model = createErosionModel(block, seed);
      let previous = erode(model, 0);
      for (let progress = 1; progress <= 100; progress++) {
        const next = erode(model, progress);
        expect(next.every((pixel, i) => pixel <= previous[i])).toBe(true);
        previous = next;
      }
    }
  });
  it("removes the whole mask at 100%, including single pixels", () => {
    for (const mask of [block, shape(["#"]), shape(["#.#", ".#.", "#.#"])]) {
      expect(erode(createErosionModel(mask, 0), 100).some(Boolean)).toBe(false);
    }
  });
  it("handles empty text masks and zero-sized masks", () => {
    for (const mask of [shape([]), shape(["....", "...."])]) {
      const model = createErosionModel(mask, 10);
      expect(erode(model, 0)).toEqual(mask.pixels);
      expect(erode(model, 100).some(Boolean)).toBe(false);
    }
  });
  it("cannot create isolated holes, even with strong spatial noise", () => {
    for (const mask of [
      block,
      shape(["#########", "#########", "###...###", "#########", "#########"]),
    ]) {
      for (const seed of [1, 41, 892]) {
        const model = createErosionModel(mask, seed);
        for (let p = 1; p < 100; p++)
          expectBoundaryConnected(mask, erode(model, p));
      }
    }
  });
  it("changes the pattern with the seed without pixel-independent noise", () => {
    expect(createErosionModel(block, 1).death).not.toEqual(
      createErosionModel(block, 2).death,
    );
    expect(
      Math.abs(erosionNoise(20, 30, 4) - erosionNoise(20.01, 30.01, 4)),
    ).toBeLessThan(0.01);
  });
  it("breaks thin bridges while retaining large fragments", () => {
    const mask = shape(
      Array.from(
        { length: 21 },
        (_, y) =>
          "#".repeat(17) +
          (y >= 9 && y <= 11 ? "#####" : ".....") +
          "#".repeat(17),
      ),
    );
    const model = createErosionModel(mask, 2026);
    const remaining = erode(model, 50);
    expect(
      connectedComponents({ ...mask, pixels: remaining }).filter(
        (c) => c.length > 30,
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });
  it("drops small detached components before ordinary erosion would remove them", () => {
    const mask = shape(
      Array.from(
        { length: 60 },
        (_, y) => "#".repeat(60) + "...." + (y < 2 ? "##" : ".."),
      ),
    );
    const model = {
      ...mask,
      seed: 2026,
      death: Uint8Array.from(mask.pixels, (pixel) => (pixel ? 100 : 0)),
    };
    bakeFragmentLoss(model);
    const fragment = [64, 65, mask.width + 64, mask.width + 65];
    const disappearance = model.death[fragment[0]];
    expect(disappearance).toBeGreaterThanOrEqual(20);
    expect(disappearance).toBeLessThan(100);
    expect(fragment.every((i) => model.death[i] === disappearance)).toBe(true);
    expect(erode(model, disappearance - 1)[fragment[0]]).toBe(1);
    for (let p = disappearance; p < 100; p++) {
      expect(fragment.every((i) => erode(model, p)[i] === 0)).toBe(true);
      expect(erode(model, p)[0]).toBe(1); // 大きな成分は残す。
    }
    const repeat = {
      ...mask,
      seed: 2026,
      death: Uint8Array.from(mask.pixels, (pixel) => (pixel ? 100 : 0)),
    };
    bakeFragmentLoss(repeat);
    expect(repeat.death).toEqual(model.death);
  });
  it("clamps out-of-range progress and rejects malformed masks", () => {
    const model = createErosionModel(block, 0);
    expect(erode(model, -1)).toEqual(block.pixels);
    expect(erode(model, 101).some(Boolean)).toBe(false);
    expect(() =>
      createErosionModel({ width: 2, height: 2, pixels: new Uint8Array(1) }, 1),
    ).toThrow(RangeError);
    expect(() => createErosionModel(block, NaN)).toThrow(RangeError);
  });
});

describe("Euclidean distance and connectivity", () => {
  it("matches a brute-force nearest-background reference, including padded edges", () => {
    const mask = shape(["#######", "#######", "##.####", "#######", "#######"]);
    const distances = distanceTransform(mask);
    for (let i = 0; i < mask.pixels.length; i++) {
      const x = i % mask.width;
      const y = Math.floor(i / mask.width);
      let expected = Infinity;
      for (let by = -1; by <= mask.height; by++)
        for (let bx = -1; bx <= mask.width; bx++) {
          if (
            bx < 0 ||
            by < 0 ||
            bx === mask.width ||
            by === mask.height ||
            !mask.pixels[by * mask.width + bx]
          )
            expected = Math.min(expected, Math.hypot(x - bx, y - by));
        }
      expect(distances[i]).toBeCloseTo(expected, 5);
    }
  });
  it("does not join diagonal pixels or wrap across rows", () => {
    expect(connectedComponents(shape(["#.#", ".#.", "#.#"]))).toHaveLength(5);
    expect(connectedComponents(shape(["..#", "#.."]))).toHaveLength(2);
  });
});
