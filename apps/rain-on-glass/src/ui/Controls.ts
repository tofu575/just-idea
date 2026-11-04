import { DEFAULT_SETTINGS, type Settings } from "../simulation/types";
import type { Simulation } from "../simulation/Simulation";
import type { Renderer } from "../rendering/Renderer";

/** UIで扱う設定の表示名、範囲、説明。 */
const PARAMETERS: {
  key: keyof Settings;
  label: string;
  min: number;
  max: number;
  hint: string;
}[] = [
  {
    key: "rain",
    label: "雨量",
    min: 0,
    max: 3,
    hint: "水滴の発生と、ゆっくりとした成長",
  },
  {
    key: "gravity",
    label: "重力",
    min: 0.15,
    max: 2,
    hint: "水滴を下へ引く力",
  },
  {
    key: "adhesion",
    label: "付着力",
    min: 0.3,
    max: 2.5,
    hint: "ガラスに留まろうとする力",
  },
  {
    key: "size",
    label: "水滴サイズ",
    min: 0.5,
    max: 1.8,
    hint: "これから生まれる水滴の大きさと成長量",
  },
  {
    key: "blur",
    label: "背景のぼかし",
    min: 0.1,
    max: 2,
    hint: "窓の向こうの、街の距離感",
  },
];

/** 鑑賞を妨げない設定、再生、全画面、キーボード操作を管理する。 */
export class Controls {
  paused = false;
  private panel = document.querySelector<HTMLElement>("#panel")!;
  private interface = document.querySelector<HTMLElement>("#interface")!;
  private settingsButton =
    document.querySelector<HTMLButtonElement>("#settings")!;
  private lastActivity = performance.now();
  private lastStats = 0;

  /** 設定と入力イベントを結び、初回から自動で鑑賞を始める。 */
  constructor(
    private simulation: Simulation,
    private renderer: Renderer,
  ) {
    const container = document.querySelector("#parameters")!;
    for (const parameter of PARAMETERS) {
      const element = document.createElement("div");
      element.className = "parameter";
      element.innerHTML = `<div class="parameter-heading"><label for="${parameter.key}">${parameter.label}</label><output for="${parameter.key}"></output></div><input id="${parameter.key}" type="range" min="${parameter.min}" max="${parameter.max}" step="0.05"/><small>${parameter.hint}</small>`;
      const input = element.querySelector("input")!;
      const output = element.querySelector("output")!;
      input.value = String(simulation.settings[parameter.key]);
      output.value = `${Number(input.value).toFixed(2)} ×`;
      input.addEventListener("input", () => {
        simulation.settings[parameter.key] = Number(input.value);
        output.value = `${Number(input.value).toFixed(2)} ×`;
      });
      container.append(element);
    }
    this.settingsButton.addEventListener("click", () => this.togglePanel());
    document
      .querySelector("#close")!
      .addEventListener("click", () => this.togglePanel(false));
    document
      .querySelector("#pause")!
      .addEventListener("click", () => this.togglePause());
    document
      .querySelector("#fullscreen")!
      .addEventListener("click", () => void this.toggleFullscreen());
    document.querySelector("#reset")!.addEventListener("click", () => {
      Object.assign(simulation.settings, DEFAULT_SETTINGS);
      for (const parameter of PARAMETERS) {
        const input = document.querySelector<HTMLInputElement>(
          `#${parameter.key}`,
        )!;
        input.value = String(DEFAULT_SETTINGS[parameter.key]);
        input.dispatchEvent(new Event("input"));
      }
    });
    document.querySelector("#debug")!.addEventListener("change", (event) => {
      renderer.debug = (event.target as HTMLInputElement).checked;
      document.querySelector("#stats")!.textContent = "";
    });
    for (const event of ["pointermove", "pointerdown", "focusin"])
      document.addEventListener(event, () => this.wake());
    document.addEventListener("keydown", (event) => this.onKey(event));
    document.querySelector("#glass")!.addEventListener("click", () => {
      if (!this.panel.hidden) this.togglePanel(false);
    });
    document.addEventListener("fullscreenchange", () => {
      const button = document.querySelector("#fullscreen")!;
      button.setAttribute(
        "aria-label",
        document.fullscreenElement ? "全画面を終了" : "フルスクリーン",
      );
    });
  }

  /** 操作直後だけ鑑賞用の小さなツールバーを表示する。 */
  private wake(): void {
    this.lastActivity = performance.now();
    this.interface.classList.add("awake");
  }

  /** 設定を開閉し、キーボードのフォーカスを適切に戻す。 */
  private togglePanel(open = this.panel.hidden): void {
    this.panel.hidden = !open;
    this.settingsButton.setAttribute("aria-expanded", String(open));
    if (open) this.panel.querySelector<HTMLInputElement>("input")!.focus();
    else this.settingsButton.focus();
    this.wake();
  }

  /** 物理時間と描画の停止状態を切り替える。 */
  private togglePause(): void {
    this.paused = !this.paused;
    document.querySelector<HTMLButtonElement>("#pause")!.textContent = this
      .paused
      ? "▷"
      : "Ⅱ";
    document
      .querySelector("#pause")!
      .setAttribute("aria-label", this.paused ? "再開" : "一時停止");
    document.querySelector<HTMLElement>("#paused")!.hidden = !this.paused;
    this.wake();
  }

  /** 対応ブラウザで全画面を切り替え、失敗時はUIに理由を示す。 */
  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      document.querySelector("#notice")!.textContent =
        "このブラウザでは全画面表示を利用できません。";
      this.togglePanel(true);
    }
  }

  /** 入力要素での操作を妨げずに鑑賞用ショートカットを扱う。 */
  private onKey(event: KeyboardEvent): void {
    if (event.key === "Escape" && !this.panel.hidden) this.togglePanel(false);
    if (
      event.target instanceof HTMLInputElement ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.repeat
    )
      return;
    if (
      event.target instanceof HTMLButtonElement &&
      (event.code === "Space" || event.key === "Enter")
    )
      return;
    if (event.code === "Space") {
      event.preventDefault();
      this.togglePause();
    }
    if (event.key.toLowerCase() === "s") this.togglePanel();
    if (event.key.toLowerCase() === "f") void this.toggleFullscreen();
  }

  /** UIの自動非表示と、低頻度の診断数値を更新する。 */
  update(now: number): void {
    if (this.panel.hidden && now - this.lastActivity > 4800)
      this.interface.classList.remove("awake");
    if (
      this.renderer.debug &&
      !this.panel.hidden &&
      now - this.lastStats > 500
    ) {
      const moving = this.simulation.drops.filter((drop) => drop.moving).length;
      document.querySelector("#stats")!.textContent =
        `${this.simulation.drops.length}滴 · 静止 ${this.simulation.drops.length - moving} · 移動 ${moving} · 合体 ${this.simulation.merges}回`;
      this.lastStats = now;
    }
  }
}
