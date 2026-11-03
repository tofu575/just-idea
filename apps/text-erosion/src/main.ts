import "./style.css";
import { rasterizeText, type FontFamily } from "./rendering/textRasterizer";
import { renderCanvas, savePng } from "./rendering/canvasRenderer";
import { createControls } from "./ui/controls";
import type { ErosionModel } from "./erosion/types";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("App root is missing");
const ui = createControls(root);
let model: ErosionModel | undefined;
let seed = 2026;
let request = 0;
let worker: Worker | undefined;
let timer: ReturnType<typeof setTimeout>;
let composing = false;

// 時間操作ではマスクの事前計算を繰り返さず、表示だけを更新する。
function redraw(): void {
  const progress = Number(ui.progress.value);
  ui.percentage.innerHTML = `${progress}<span>%</span>`;
  ui.age.textContent =
    progress === 0 ? "風化前" : progress === 100 ? "消滅" : `風化 ${progress}%`;
  ui.progress.setAttribute(
    "aria-valuetext",
    `${progress}% — ${ui.age.textContent}`,
  );
  if (model) renderCanvas(ui.canvas, model, progress);
}
// 古い計算を中断し、最後に入力された文字・書体だけを採用する。
function regenerate(): void {
  clearTimeout(timer);
  const current = ++request;
  worker?.terminate();
  ui.save.disabled = true;
  ui.status.textContent = "輪郭と風化パターンを計算しています…";
  try {
    const mask = rasterizeText(ui.text.value, ui.font.value as FontFamily);
    worker = new Worker(
      new URL("./erosion/erosionWorker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (
      event: MessageEvent<{
        model?: ErosionModel;
        error?: string;
        request: number;
      }>,
    ) => {
      if (event.data.request !== request) return;
      if (!event.data.model) {
        ui.status.textContent = event.data.error ?? "再生成してください。";
        return;
      }
      model = event.data.model;
      ui.pattern.textContent = `PATTERN ${seed.toString(16).toUpperCase().padStart(8, "0")}`;
      ui.status.textContent = ui.text.value.trim()
        ? "スライダーで時間を進めたり、戻したりできます。"
        : "文字を入力すると、ここにプレビューが表示されます。";
      ui.save.disabled = false;
      redraw();
      worker?.terminate();
      worker = undefined;
    };
    worker.onerror = () => {
      ui.status.textContent =
        "計算を開始できませんでした。再生成をお試しください。";
    };
    worker.postMessage({ mask, seed, request: current });
  } catch {
    ui.status.textContent =
      "Canvasを利用できません。対応するブラウザでお試しください。";
  }
}
// 日本語入力の確定を待ち、連続した入力をまとめて再計算する。
function scheduleRegeneration(): void {
  clearTimeout(timer);
  ui.save.disabled = true;
  request++;
  worker?.terminate();
  worker = undefined;
  ui.status.textContent = "入力の確定を待っています…";
  if (!composing) timer = setTimeout(regenerate, 180);
}
ui.text.addEventListener("compositionstart", () => {
  composing = true;
  clearTimeout(timer);
});
ui.text.addEventListener("compositionend", () => {
  composing = false;
  scheduleRegeneration();
});
ui.text.addEventListener("input", scheduleRegeneration);
ui.font.addEventListener("change", regenerate);
ui.progress.addEventListener("input", redraw);
ui.reset.addEventListener("click", () => {
  ui.progress.value = "0";
  redraw();
});
ui.regenerate.addEventListener("click", () => {
  const previousSeed = seed;
  seed = (seed + 1 + crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
  if (seed === previousSeed) seed = (seed + 1) >>> 0;
  regenerate();
});
ui.save.addEventListener("click", () => savePng(ui.canvas));
void document.fonts.ready.then(regenerate);
