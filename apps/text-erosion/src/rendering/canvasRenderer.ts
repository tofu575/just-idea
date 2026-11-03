import { erode } from "../erosion/erosionEngine";
import type { ErosionModel } from "../erosion/types";

// 表示Canvasに青色の残存文字と薄い背景を描き、PNGとプレビューを一致させる。
export function renderCanvas(
  canvas: HTMLCanvasElement,
  model: ErosionModel,
  progress: number,
): void {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  canvas.width = model.width;
  canvas.height = model.height;
  const pixels = erode(model, progress);
  const image = context.createImageData(model.width, model.height);
  for (let i = 0; i < pixels.length; i++) {
    const offset = i * 4;
    image.data[offset] = pixels[i] ? 36 : 247;
    image.data[offset + 1] = pixels[i] ? 83 : 248;
    image.data[offset + 2] = pixels[i] ? 177 : 246;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}
// Blobで画像を保存し、一時URLを解放する。
export function savePng(canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "text-erosion.png";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
