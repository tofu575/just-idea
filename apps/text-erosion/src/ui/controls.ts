// ラベルと操作領域を持つ単一画面を組み立てる。入力値をHTMLに埋め込まない。
export function createControls(root: HTMLElement) {
  root.innerHTML = `
    <main>
      <header><span class="eyebrow">A STUDY OF TIME · 01</span><h1>文字風化<span>Text Erosion</span></h1><p>輪郭が欠け、つながりがほどける。<br class="mobile-break">文字に流れる時間を、指先で。</p></header>
      <section class="preview" aria-label="文字のプレビュー">
        <div class="preview-meta"><span>WEATHERED LETTERS</span><span id="preview-age">風化前</span></div>
        <canvas id="preview" width="640" height="256" role="img" aria-label="文字の風化プレビュー"></canvas>
        <div class="preview-footer"><span>輪郭から、少しずつ。</span><span id="pattern"></span></div>
      </section>
      <section class="controls" aria-label="風化の設定">
        <div class="input-row"><label class="text-field" for="text">風化させる文字<textarea id="text" rows="1" spellcheck="false" placeholder="文字を入力してください">奥多摩湖</textarea></label>
        <label for="font">書体<select id="font"><option value="mincho">明朝体</option><option value="gothic">ゴシック体</option></select></label></div>
        <div class="progress-heading"><label for="progress">風化の進行度</label><output id="percentage" for="progress">0<span>%</span></output></div>
        <input id="progress" type="range" min="0" max="100" step="1" value="0" aria-valuetext="0% — 風化前" />
        <div class="scale" aria-hidden="true"><span>0 · 元のかたち</span><span>50 · 破断</span><span>100 · 消滅</span></div>
        <div class="actions"><button id="regenerate" type="button">↻ パターンを再生成</button><button id="reset" type="button">進行度をリセット</button><button id="save" class="primary" type="button" disabled>PNGを保存 ↓</button></div>
        <p id="status" role="status" aria-live="polite">文字を準備しています…</p>
      </section>
      <footer>同じパターンなら、時間を戻しても同じかたちに。<span>すべての処理は、このブラウザの中で。</span></footer>
    </main>`;
  // 必須のUI要素を取得し、テンプレートとの不整合を早く検出する。
  function element<T extends HTMLElement>(selector: string): T {
    const found = root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing control: ${selector}`);
    return found;
  }
  return {
    text: element<HTMLTextAreaElement>("#text"),
    font: element<HTMLSelectElement>("#font"),
    progress: element<HTMLInputElement>("#progress"),
    percentage: element<HTMLOutputElement>("#percentage"),
    regenerate: element<HTMLButtonElement>("#regenerate"),
    reset: element<HTMLButtonElement>("#reset"),
    save: element<HTMLButtonElement>("#save"),
    canvas: element<HTMLCanvasElement>("#preview"),
    status: element<HTMLParagraphElement>("#status"),
    age: element<HTMLSpanElement>("#preview-age"),
    pattern: element<HTMLSpanElement>("#pattern"),
  };
}
