import { defineConfig } from "vite";

export default defineConfig({
  // 単体ビルドもサブディレクトリで配信できるよう、アセットを相対参照にする。
  // 公開CIではPagesのベースパスに合わせて --base で上書きする。
  base: "./",
});
