import { createErosionModel } from "./erosionEngine";
import type { Mask } from "./types";

// 重い事前計算をUIスレッドの外へ移し、入力とスライダーの応答を維持する。
self.onmessage = (
  event: MessageEvent<{ mask: Mask; seed: number; request: number }>,
) => {
  const { mask, seed, request } = event.data;
  try {
    const model = createErosionModel(mask, seed);
    self.postMessage({ model, request });
  } catch {
    self.postMessage({
      error: "風化データを作成できませんでした。再生成してください。",
      request,
    });
  }
};
