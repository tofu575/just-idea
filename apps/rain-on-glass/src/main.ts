import "./style.css";
import { Simulation } from "./simulation/Simulation";
import { Renderer } from "./rendering/Renderer";
import { Controls } from "./ui/Controls";

const canvas = document.querySelector<HTMLCanvasElement>("#glass")!;
const seedValue = new URLSearchParams(location.search).get("seed");
const seed =
  seedValue !== null && Number.isFinite(Number(seedValue))
    ? Number(seedValue)
    : crypto.getRandomValues(new Uint32Array(1))[0];
const simulation = new Simulation(window.innerWidth, window.innerHeight, seed);
const renderer = new Renderer(canvas);
const controls = new Controls(simulation, renderer);
let previous = performance.now();
let resizePending = false;

/** 物理と背景のサイズ変更を同じフレームで適用する。 */
function resize(): void {
  simulation.resize(
    Math.max(1, window.innerWidth),
    Math.max(1, window.innerHeight),
  );
  renderer.resize(
    simulation.width,
    simulation.height,
    simulation.settings.blur,
  );
}

/** 非表示中の時間を捨て、復帰直後の大量の滑落を防ぐ。 */
function onVisibility(): void {
  previous = performance.now();
}

/** 物理の固定刻みと画面の更新を分離して進める。 */
function frame(now: number): void {
  if (resizePending) {
    resize();
    resizePending = false;
  }
  if (!document.hidden) {
    if (!controls.paused) simulation.advance((now - previous) / 1000);
    renderer.render(simulation);
    controls.update(now);
  }
  previous = now;
  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  resizePending = true;
});
document.addEventListener("visibilitychange", onVisibility);
resize();
requestAnimationFrame(frame);
