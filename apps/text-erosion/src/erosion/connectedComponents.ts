import type { Mask } from "./types";
// 四近傍の連結成分を取得する。斜めだけの接触は破断として扱う。
export function connectedComponents(mask: Mask): number[][] {
  const visited = new Uint8Array(mask.pixels.length);
  const components: number[][] = [];
  for (let start = 0; start < mask.pixels.length; start++) {
    if (!mask.pixels[start] || visited[start]) continue;
    const component = [start];
    visited[start] = 1;
    for (let head = 0; head < component.length; head++) {
      for (const next of neighbors(component[head], mask.width, mask.height)) {
        if (!mask.pixels[next] || visited[next]) continue;
        visited[next] = 1;
        component.push(next);
      }
    }
    components.push(component);
  }
  return components;
}
// 行端の折り返しを避けて、有効な四近傍だけを返す。
export function neighbors(
  index: number,
  width: number,
  height: number,
): number[] {
  const result: number[] = [];
  if (index % width > 0) result.push(index - 1);
  if (index % width < width - 1) result.push(index + 1);
  if (index >= width) result.push(index - width);
  if (index < width * (height - 1)) result.push(index + width);
  return result;
}
