import { describe, expect, it } from "vitest";
import { MAX_DROPS, MAX_TRAILS, Simulation, STEP } from "./Simulation";
import { radius } from "./types";

/** 指定秒数を描画に依存しない固定刻みで進める。 */
function run(simulation: Simulation, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / STEP); i++) simulation.advance(STEP);
}

/** 発生と凝結を止め、少数の水滴の物理だけを観察する。 */
function isolated(): Simulation {
  const simulation = new Simulation(640, 480, 575, false);
  simulation.settings.rain = 0;
  return simulation;
}

describe("水滴の物理的不変条件", () => {
  it("小滴は長時間ガラスに保持される", () => {
    const simulation = isolated();
    const drop = simulation.addDrop(100, 100, 2)!;
    run(simulation, 120);
    expect(drop.x).toBe(100);
    expect(drop.y).toBe(100);
    expect(drop.moving).toBe(false);
    expect(drop.volume).toBeCloseTo(8, 10);
  });

  it("合体は体積と運動量を保存する", () => {
    const simulation = isolated();
    const a = simulation.addDrop(100, 100, 5)!;
    const b = simulation.addDrop(103, 103, 3)!;
    a.moving = true;
    a.vx = 2;
    a.vy = 25;
    b.vy = 1;
    const volume = a.volume + b.volume;
    const momentum = a.vy * a.volume + b.vy * b.volume;
    simulation.merge(a, b);
    expect(a.volume).toBe(volume);
    expect(a.vy * a.volume).toBeCloseTo(momentum, 10);
    expect(a.x).toBe(100);
    expect(a.y).toBe(100);
    expect(radius(a)).toBeCloseTo(Math.cbrt(volume), 10);
  });

  it("静止した大滴は合体によって保持限界を超える", () => {
    const simulation = isolated();
    const a = simulation.addDrop(150, 150, 8)!;
    const b = simulation.addDrop(160, 150, 8)!;
    a.pinning = b.pinning = 1;
    expect(radius(a)).toBeLessThan(simulation.releaseRadius(a));
    simulation.advance(STEP);
    expect(simulation.drops).toHaveLength(1);
    expect(simulation.drops[0].volume).toBeCloseTo(1024, 10);
    expect(simulation.drops[0].moving).toBe(true);
    run(simulation, 1);
    expect(simulation.drops[0].vy).toBeGreaterThan(5);
  });

  it("上から滑る滴が静止滴を巻き込み、体積を保って一緒に滑る", () => {
    const simulation = isolated();
    const runner = simulation.addDrop(200, 80, 10)!;
    runner.moving = true;
    runner.vy = 10;
    const pinned = simulation.addDrop(200, 111, 4)!;
    const initialVolume = runner.volume + pinned.volume;
    run(simulation, 1.3);
    expect(simulation.merges).toBeGreaterThan(0);
    expect(simulation.drops.some((drop) => drop.id === pinned.id)).toBe(false);
    expect(runner.moving).toBe(true);
    expect(runner.y).toBeGreaterThan(111);
    expect(
      simulation.drops.reduce((sum, drop) => sum + drop.volume, 0),
    ).toBeCloseTo(initialVolume, 8);
  });

  it("空間分割の境界でも接触を検出する", () => {
    const simulation = isolated();
    simulation.addDrop(47, 95, 3);
    simulation.addDrop(50, 97, 3);
    simulation.advance(STEP);
    expect(simulation.drops).toHaveLength(1);
    expect(simulation.drops[0].volume).toBeCloseTo(54, 10);
  });

  it("30fpsと120fpsでも同じ物理状態になる", () => {
    const a = new Simulation(500, 400, 3);
    const b = new Simulation(500, 400, 3);
    for (let i = 0; i < 300; i++) a.advance(1 / 30);
    for (let i = 0; i < 1200; i++) b.advance(1 / 120);
    expect(a.drops).toEqual(b.drops);
    expect(a.merges).toBe(b.merges);
  });

  it("雨量は新滴発生・成長に作用し、既存滴の力学には直接作用しない", () => {
    const a = isolated();
    const b = isolated();
    const first = a.addDrop(100, 100, 12)!;
    const second = b.addDrop(100, 100, 12)!;
    first.growth = second.growth = 0;
    b.settings.rain = 3;
    a.advance(STEP);
    b.advance(STEP);
    expect(first.vy).toBe(second.vy);
    expect(first.y).toBe(second.y);
  });

  it("凝結で成長した滴が自発的に滑落する", () => {
    const simulation = isolated();
    const drop = simulation.addDrop(200, 50, 5)!;
    drop.volume = (simulation.releaseRadius(drop) * 0.995) ** 3;
    simulation.settings.rain = 1;
    run(simulation, 8);
    expect(simulation.releases).toBeGreaterThan(0);
    expect(drop.moving).toBe(true);
  });

  it("リサイズでは体積を変えず、位置を新しい画面に対応させる", () => {
    const simulation = isolated();
    const drop = simulation.addDrop(320, 240, 5)!;
    simulation.resize(320, 960);
    expect([drop.x, drop.y, drop.volume]).toEqual([160, 480, 125]);
  });

  it("上限を超えて新滴を作らず、既存滴を突然削除しない", () => {
    const simulation = isolated();
    for (let i = 0; i < MAX_DROPS + 100; i++) simulation.addDrop(i, 100, 1);
    expect(simulation.drops).toHaveLength(MAX_DROPS);
    expect(simulation.drops[0].id).toBe(0);
  });

  it("10分の強雨でも滴・水膜が有界で、座標と体積が有限である", () => {
    const simulation = new Simulation(480, 320, 34);
    simulation.settings.rain = 3;
    run(simulation, 600);
    expect(simulation.drops.length).toBeLessThanOrEqual(MAX_DROPS);
    expect(simulation.trails.length).toBeLessThanOrEqual(MAX_TRAILS);
    expect(simulation.merges).toBeGreaterThan(30);
    expect(simulation.releases).toBeGreaterThan(10);
    for (const drop of simulation.drops) {
      expect(Number.isFinite(drop.x + drop.y + drop.volume + drop.vy)).toBe(
        true,
      );
      expect(drop.volume).toBeGreaterThan(0);
    }
  }, 60000);
});
