import {
  DEFAULT_SETTINGS,
  radius,
  seededRandom,
  type Drop,
  type Settings,
  type Trail,
} from "./types";

export const STEP = 1 / 60;
export const MAX_DROPS = 2400;
export const MAX_TRAILS = 2800;

/** 固定刻みで付着・凝結・摩擦・合体を更新する独立した物理モデル。 */
export class Simulation {
  drops: Drop[] = [];
  trails: Trail[] = [];
  settings: Settings = { ...DEFAULT_SETTINGS };
  time = 0;
  merges = 0;
  releases = 0;
  private nextId = 0;
  private traceHeads = new Map<number, { x: number; y: number }>();
  private accumulated = 0;
  private birthWait = 0;
  private random: () => number;

  /** 画面サイズと任意のシードから初期の結露を作る。 */
  constructor(
    public width: number,
    public height: number,
    seed = 575,
    populate = true,
  ) {
    this.random = seededRandom(seed);
    if (populate) this.populate();
  }

  /** 面積に比例した不規則な水滴を、一部は滑落直前の状態で配置する。 */
  private populate(): void {
    const count = Math.min(1700, Math.round((this.width * this.height) / 1150));
    for (let i = 0; i < count; i++) {
      const r =
        this.random() < 0.035
          ? 6 + this.random() * 3.5
          : 0.65 + this.random() ** 2.1 * 4.7;
      const drop = this.addDrop(
        this.random() * this.width,
        this.random() * this.height,
        r,
      );
      if (drop && i % 83 === 0)
        drop.volume =
          (this.releaseRadius(drop) * (0.97 + this.random() * 0.05)) ** 3;
    }
  }

  /** 新しい水滴を静止状態で作る。上限では既存の水滴を消さず発生を抑える。 */
  addDrop(x: number, y: number, r: number): Drop | undefined {
    if (this.drops.length >= MAX_DROPS) return undefined;
    const drop: Drop = {
      id: this.nextId++,
      x,
      y,
      volume: r ** 3,
      vx: 0,
      vy: 0,
      moving: false,
      pinning: 0.78 + this.random() * 0.65,
      growth: 0.009 + this.random() ** 2 * 0.025,
      phase: this.random() * Math.PI * 2,
      age: 0,
      shape: this.random(),
    };
    this.drops.push(drop);
    return drop;
  }

  /** 重力の体積依存と接触線の保持力から滑落半径を近似する。 */
  releaseRadius(drop: Drop): number {
    const surface =
      1 + 0.1 * Math.sin(drop.x * 0.017) * Math.cos(drop.y * 0.011);
    return (
      9.1 *
      Math.sqrt(
        (this.settings.adhesion * drop.pinning * surface) /
          Math.max(0.01, this.settings.gravity),
      )
    );
  }

  /** フレーム時間を固定刻みに分配し、復帰時の追いつき計算を制限する。 */
  advance(seconds: number): void {
    this.accumulated += Math.min(Math.max(0, seconds), 0.1);
    while (this.accumulated >= STEP - 1e-10) {
      this.step(STEP);
      this.accumulated -= STEP;
    }
  }

  /** 座標を画面内に移し、半径や体積はリサイズで変更しない。 */
  resize(width: number, height: number): void {
    for (const drop of this.drops) {
      drop.x *= width / this.width;
      drop.y *= height / this.height;
    }
    this.trails = [];
    this.traceHeads.clear();
    this.width = width;
    this.height = height;
  }

  /** 凝結と滑落を進めた後、接触した水滴をまとめる。 */
  private step(dt: number): void {
    this.time += dt;
    this.birthWait -=
      (dt * this.settings.rain * this.width * this.height) / 1_000_000;
    while (this.birthWait <= 0) {
      if (this.settings.rain > 0) {
        const r = (0.65 + this.random() ** 2 * 2.8) * this.settings.size;
        const drop = this.addDrop(
          this.random() * this.width,
          this.random() * this.height,
          r,
        );
        if (drop) drop.age = -0.8; // 新着は輪郭を徐々に現す。
      }
      this.birthWait += -Math.log(Math.max(0.00001, this.random())) / 4.5;
    }
    for (const drop of [...this.drops]) {
      drop.age += dt;
      let r = radius(drop);
      // 凝結は表面積に比例するため、半径の成長速度に換算する。
      r += drop.growth * this.settings.rain * this.settings.size * dt;
      drop.volume = r ** 3;
      const critical = this.releaseRadius(drop);
      if (!drop.moving && r > critical) {
        drop.moving = true;
        this.releases++;
      }
      if (!drop.moving) continue;
      const previousX = drop.x;
      const previousY = drop.y;
      const friction = 0.48 + 0.1 * Math.sin(drop.y * 0.036 + drop.phase);
      const drive =
        210 * this.settings.gravity * (1 - (friction * critical ** 2) / r ** 2);
      drop.vy = Math.max(0, drop.vy + (drive - (1.4 + 16 / r) * drop.vy) * dt);
      const lateral =
        Math.sin(drop.y * 0.024 + drop.phase) +
        0.4 * Math.sin(drop.y * 0.067 + drop.phase);
      drop.vx += (lateral * drop.vy * 0.1 - drop.vx * 4) * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      if (drop.vy < 0.25 && r < critical * 0.82) {
        drop.moving = false;
        drop.vx = drop.vy = 0;
      }
      const head = this.traceHeads.get(drop.id) ?? {
        x: previousX,
        y: previousY,
      };
      if (!this.traceHeads.has(drop.id)) this.traceHeads.set(drop.id, head);
      if (drop.y - head.y >= 4) {
        this.trails.push({
          x: head.x,
          y: head.y,
          endX: drop.x,
          endY: drop.y,
          width: Math.min(2.8, r * 0.16),
          life: 1,
        });
        const distance = drop.y - head.y;
        this.traceHeads.set(drop.id, { x: drop.x, y: drop.y });
        if (this.random() < distance / 110) {
          const beadRadius = 0.7 + this.random() * 0.7;
          const bead = this.addDrop(
            previousX + (this.random() - 0.5) * r * 0.4,
            previousY - r * 1.5,
            beadRadius,
          );
          if (bead) drop.volume -= bead.volume;
        }
      }
    }
    this.collide();
    this.drops = this.drops.filter(
      (drop) => drop.y - radius(drop) * 2 < this.height + 20,
    );
    const activeIds = new Set(this.drops.map((drop) => drop.id));
    for (const id of this.traceHeads.keys())
      if (!activeIds.has(id)) this.traceHeads.delete(id);
    for (const trail of this.trails) trail.life -= dt / 22;
    this.trails = this.trails
      .filter((trail) => trail.life > 0)
      .slice(-MAX_TRAILS);
  }

  /** 体積と運動量を保存して合体し、移動中の中心位置の飛躍を抑える。 */
  merge(a: Drop, b: Drop): void {
    const volume = a.volume + b.volume;
    if (!a.moving) {
      a.x = (a.x * a.volume + b.x * b.volume) / volume;
      a.y = (a.y * a.volume + b.y * b.volume) / volume;
    }
    a.vx = (a.vx * a.volume + b.vx * b.volume) / volume;
    a.vy = (a.vy * a.volume + b.vy * b.volume) / volume;
    a.volume = volume;
    a.moving ||= b.moving;
    a.age = Math.max(a.age, b.age);
    if (!a.moving && radius(a) > this.releaseRadius(a)) {
      a.moving = true;
      this.releases++;
    }
    this.merges++;
  }

  /** 接触範囲を空間ハッシュへ登録し、隣接候補だけを厳密に判定する。 */
  private collide(): void {
    const cellSize = 48;
    const cells = new Map<string, Drop[]>();
    const removed = new Set<number>();
    // 大きい水滴も全接触セルへ登録し、セル境界の見落としを防ぐ。
    for (const drop of this.drops) {
      const r = radius(drop) * 1.35;
      for (
        let x = Math.floor((drop.x - r) / cellSize);
        x <= Math.floor((drop.x + r) / cellSize);
        x++
      ) {
        for (
          let y = Math.floor((drop.y - r) / cellSize);
          y <= Math.floor((drop.y + r) / cellSize);
          y++
        ) {
          const key = `${x},${y}`;
          const bucket = cells.get(key);
          if (bucket) bucket.push(drop);
          else cells.set(key, [drop]);
        }
      }
    }
    const checked = new Set<string>();
    for (const bucket of cells.values()) {
      for (let i = 0; i < bucket.length; i++) {
        let a = bucket[i];
        if (removed.has(a.id)) continue;
        for (let j = i + 1; j < bucket.length; j++) {
          let b = bucket[j];
          if (removed.has(a.id) || removed.has(b.id)) continue;
          const key = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
          if (checked.has(key)) continue;
          checked.add(key);
          const dx = a.x - b.x;
          const dy = (a.y - b.y) / (a.moving || b.moving ? 1.15 : 1);
          if (dx * dx + dy * dy > ((radius(a) + radius(b)) * 0.88) ** 2)
            continue;
          if (
            (!a.moving && b.moving) ||
            (a.moving === b.moving && b.volume > a.volume)
          )
            [a, b] = [b, a];
          this.merge(a, b);
          removed.add(b.id);
        }
      }
    }
    if (removed.size)
      this.drops = this.drops.filter((drop) => !removed.has(drop.id));
  }
}
