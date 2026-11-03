// カードのDomain情報をUIがそのまま描画できる形へ変換した表示モデル。
export type GameCardViewModel = Readonly<{
  id: string;
  titleKey: string;
  titleValues?: Readonly<Record<string, string | number>>;
  backgroundColor: string;
  backgroundImage?: string;
}>;
