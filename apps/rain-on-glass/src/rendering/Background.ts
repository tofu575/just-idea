import { seededRandom } from "../simulation/types";

/** 画像素材を使わず、夕暮れの街と不規則な玉ぼけを生成する。 */
export class Background {
  canvas = document.createElement("canvas");
  pixels = new Uint8ClampedArray();
  width = 1;
  height = 1;
  scale = 1;

  /** 背景解像度を制限し、ぼかした風景の画素を屈折用に保持する。 */
  build(width: number, height: number, blur: number): void {
    this.scale = Math.min(0.8, 1440 / width);
    this.width = this.canvas.width = Math.max(1, Math.ceil(width * this.scale));
    this.height = this.canvas.height = Math.max(
      1,
      Math.ceil(height * this.scale),
    );
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.scale(this.scale, this.scale);
    const sky = ctx.createLinearGradient(0, 0, width * 0.7, height);
    sky.addColorStop(0, "#172931");
    sky.addColorStop(0.42, "#34464a");
    sky.addColorStop(1, "#111c23");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    const random = seededRandom(90715);
    ctx.filter = `blur(${(10 + blur * 17) * this.scale}px)`;
    // 暗い建物を異なる高さに重ね、格子に見える窓の反復を避ける。
    for (let i = 0; i < 25; i++) {
      const x = random() * width;
      const w = 35 + random() * width * 0.15;
      const top = height * (0.12 + random() * 0.48);
      ctx.fillStyle = `rgba(7, 19, 26, ${0.15 + random() * 0.35})`;
      ctx.fillRect(x, top, w, height);
    }
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${(2 + blur * 5) * this.scale}px)`;
    for (let i = 0; i < 75; i++) {
      const x = random() * width * 1.1 - width * 0.05;
      const y = height * (0.33 + random() * 0.75);
      const r = (3 + random() ** 2 * 25) * Math.max(0.65, width / 1500);
      const warm = random() > 0.32;
      const color = warm
        ? `${220 + Math.floor(random() * 35)}, ${135 + Math.floor(random() * 65)}, 81`
        : "115, 180, 190";
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      glow.addColorStop(0, `rgba(${color}, ${0.35 + random() * 0.55})`);
      glow.addColorStop(0.22, `rgba(${color}, 0.33)`);
      glow.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
      if (random() < 0.25) {
        ctx.fillStyle = `rgba(${color}, 0.08)`;
        ctx.fillRect(x - r / 2, y + r, r, height * 0.35 * random());
      }
    }
    // 近い道路の柔らかい赤と琥珀色を、少数の焦点として加える。
    for (const [px, py, r, color] of [
      [0.22, 0.72, 28, "231, 153, 84"],
      [0.72, 0.63, 17, "236, 176, 111"],
      [0.88, 0.83, 16, "191, 72, 63"],
    ] as const) {
      const x = width * px;
      const y = height * py;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      glow.addColorStop(0, `rgba(${color}, 0.8)`);
      glow.addColorStop(0.2, `rgba(${color}, 0.4)`);
      glow.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    }
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    const shade = ctx.createRadialGradient(
      width * 0.5,
      height * 0.48,
      height * 0.1,
      width * 0.5,
      height * 0.48,
      Math.max(width, height) * 0.7,
    );
    shade.addColorStop(0, "#030d1400");
    shade.addColorStop(1, "#030d1490");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    this.pixels = ctx.getImageData(0, 0, this.width, this.height).data;
  }

  /** 背景の位置を画素添字へ変換し、端をクランプする。 */
  index(x: number, y: number): number {
    const px = Math.max(
      0,
      Math.min(this.width - 1, Math.floor(x * this.scale)),
    );
    const py = Math.max(
      0,
      Math.min(this.height - 1, Math.floor(y * this.scale)),
    );
    return (py * this.width + px) * 4;
  }
}
