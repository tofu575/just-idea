import { radius, type Drop } from "../simulation/types";
import type { Simulation } from "../simulation/Simulation";
import { Background } from "./Background";

/** 静止水滴のレンズ画像を再利用するキャッシュ。 */
interface Lens {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  r: number;
  stretch: number;
  halfWidth: number;
  halfHeight: number;
}

/** CPUで屈折像を作り、Canvas 2Dで水膜・水滴・診断表示を合成する。 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private background = new Background();
  private lenses = new Map<number, Lens>();
  private dpr = 1;
  private width = 1;
  private height = 1;
  private blur = -1;
  debug = false;

  /** 不透明なキャンバスを確保する。WebGLや外部画像は使用しない。 */
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
  }

  /** 高DPIの上限と背景解像度を管理し、サイズ変更時にキャッシュを破棄する。 */
  resize(width: number, height: number, blur: number): void {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.background.build(width, height, blur);
    this.blur = blur;
    this.lenses.clear();
  }

  /** 背景・薄い水膜・レンズ像の順に描画し、消滅した水滴の画像を解放する。 */
  render(simulation: Simulation): void {
    if (simulation.settings.blur !== this.blur)
      this.resize(this.width, this.height, simulation.settings.blur);
    const ctx = this.ctx;
    ctx.drawImage(this.background.canvas, 0, 0, this.width, this.height);
    this.renderTrails(simulation);
    const active = new Set<number>();
    for (const drop of simulation.drops) {
      active.add(drop.id);
      const r = radius(drop);
      const stretch =
        1 + Math.min(0.65, drop.vy / 160) + Math.max(0, r - 5) * 0.012;
      let lens = this.lenses.get(drop.id);
      if (
        !lens ||
        Math.abs(lens.r - r) > 0.15 ||
        Math.abs(lens.x - drop.x) + Math.abs(lens.y - drop.y) > 0.6 ||
        Math.abs(lens.stretch - stretch) > 0.035
      ) {
        lens = this.makeLens(drop, r, stretch, lens?.canvas);
        this.lenses.set(drop.id, lens);
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, (drop.age + 0.8) / 0.8));
      ctx.drawImage(
        lens.canvas,
        drop.x - lens.halfWidth,
        drop.y - lens.halfHeight,
        lens.halfWidth * 2,
        lens.halfHeight * 2,
      );
    }
    ctx.globalAlpha = 1;
    for (const id of this.lenses.keys())
      if (!active.has(id)) this.lenses.delete(id);
    if (this.debug) this.renderDebug(simulation);
  }

  /** 球冠の法線を近似し、中心の弱い拡大と縁の強い屈折・反射を描き分ける。 */
  private makeLens(
    drop: Drop,
    r: number,
    stretch: number,
    reusable?: HTMLCanvasElement,
  ): Lens {
    const canvas = reusable ?? document.createElement("canvas");
    const halfWidth = r * (0.94 + drop.shape * 0.09) + 2;
    const halfHeight = r * stretch + 2;
    canvas.width = Math.ceil(halfWidth * 2 * this.dpr);
    canvas.height = Math.ceil(halfHeight * 2 * this.dpr);
    const ctx = canvas.getContext("2d")!;
    const data = ctx.createImageData(canvas.width, canvas.height);
    const bg = this.background;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const localY =
          ((y + 0.5) / canvas.height) * halfHeight * 2 - halfHeight;
        const ny = localY / (r * stretch);
        // 上部を少し絞り、静止中も完全な楕円にはしない。
        const taper =
          1 - Math.max(0, -ny) * (0.07 + Math.min(0.13, drop.vy / 500));
        const nx =
          (((x + 0.5) / canvas.width) * halfWidth * 2 - halfWidth) /
          (r * (0.94 + drop.shape * 0.09) * taper);
        const rho = Math.sqrt(nx * nx + ny * ny);
        if (rho >= 1.04) continue;
        const edge = Math.min(1, Math.max(0, (1.02 - rho) * r * this.dpr));
        // 縁に近い急な法線ほど背景の遠い場所を取り込む。
        const bend = 4 + (22 + r * 10) * Math.min(1, rho) ** 4;
        const index = bg.index(
          drop.x + nx * r * 0.5 - nx * bend,
          drop.y + ny * r * 0.5 - ny * bend * stretch + r * 0.65,
        );
        const rim = Math.exp(-(((rho - 0.91) / 0.065) ** 2));
        const shadow = Math.exp(-(((rho - 0.99) / 0.038) ** 2));
        const lightDirection = Math.max(
          0,
          (-nx * 0.6 - ny * 0.8) / Math.max(0.01, rho),
        );
        const highlight = rim * lightDirection ** 5 * 155;
        const lowerRim = rim * Math.max(0, ny) ** 5 * 25;
        const factor = 1.07 - shadow * 0.48 - rim * (1 - lightDirection) * 0.19;
        const offset = (y * canvas.width + x) * 4;
        for (let c = 0; c < 3; c++)
          data.data[offset + c] = Math.min(
            255,
            bg.pixels[index + c] * factor + highlight + lowerRim,
          );
        data.data[offset + 3] = edge * 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    return { canvas, x: drop.x, y: drop.y, r, stretch, halfWidth, halfHeight };
  }

  /** 水膜の両縁を暗くし、内部に横方向へずれた背景色を映して濡れを表す。 */
  private renderTrails(simulation: Simulation): void {
    const ctx = this.ctx;
    const bg = this.background;
    ctx.lineCap = "round";
    for (const trail of simulation.trails) {
      const index = bg.index(trail.endX + 12, trail.endY - 5);
      ctx.beginPath();
      ctx.moveTo(trail.x, trail.y);
      ctx.lineTo(trail.endX, trail.endY);
      ctx.lineWidth = trail.width + 1.2;
      ctx.strokeStyle = `rgba(4, 14, 20, ${trail.life * 0.07})`;
      ctx.stroke();
      ctx.lineWidth = trail.width;
      ctx.strokeStyle = `rgba(${bg.pixels[index] + 9}, ${bg.pixels[index + 1] + 10}, ${bg.pixels[index + 2] + 11}, ${trail.life * 0.24})`;
      ctx.stroke();
    }
  }

  /** 静止・移動の色分けと速度・体積を重ね、調整時の観察を助ける。 */
  private renderDebug(simulation: Simulation): void {
    const ctx = this.ctx;
    ctx.font = "10px monospace";
    for (const drop of simulation.drops) {
      if (radius(drop) < 4) continue;
      ctx.strokeStyle = ctx.fillStyle = drop.moving ? "#f1b978" : "#8bbbc8";
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, radius(drop) + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(
        `${drop.moving ? "↓" : "•"} V${drop.volume.toFixed(0)} ${drop.vy.toFixed(0)}px/s`,
        drop.x + radius(drop) + 5,
        drop.y,
      );
    }
  }
}
