import type { Mask } from "../erosion/types";

// OSの日本語フォントを優先し、描画と風化計算の責任を分離する。
export const fontFamilies = {
  mincho: '"Noto Serif CJK JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
  gothic:
    '"Noto Sans CJK JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
};
export type FontFamily = keyof typeof fontFamilies;

// 非表示のCanvasで文字をラスタライズし、DPRに依存しない計算量に抑える。
export function rasterizeText(text: string, family: FontFamily): Mask {
  const width = 640;
  const height = 256;
  const padding = 32;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  const pixels = new Uint8Array(width * height);
  if (!text.trim()) return { width, height, pixels };
  const lines = text.split("\n");
  let size = Math.min(180, (height - padding * 2) / (lines.length * 1.25));
  context.font = `700 ${size}px ${fontFamilies[family]}`;
  const widest = lines.reduce(
    (maximum, line) => Math.max(maximum, context.measureText(line).width),
    1,
  );
  size *= Math.min(1, (width - padding * 2) / widest);
  context.font = `700 ${size}px ${fontFamilies[family]}`;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  const metrics = lines.map((line) => context.measureText(line));
  const ascent = metrics.reduce(
    (maximum, metric) => Math.max(maximum, metric.actualBoundingBoxAscent),
    size * 0.8,
  );
  const descent = metrics.reduce(
    (maximum, metric) => Math.max(maximum, metric.actualBoundingBoxDescent),
    size * 0.2,
  );
  const lineHeight = size * 1.25;
  const firstBaseline =
    (height - ((lines.length - 1) * lineHeight + ascent + descent)) / 2 +
    ascent;
  lines.forEach((line, i) =>
    context.fillText(line, width / 2, firstBaseline + i * lineHeight),
  );
  const alpha = context.getImageData(0, 0, width, height).data;
  for (let i = 0; i < pixels.length; i++)
    pixels[i] = alpha[i * 4 + 3] >= 128 ? 1 : 0;
  return { width, height, pixels };
}
