import type { GameCardId } from '../../domain/models/card/GameCardId';

// カードが各色成分へ与える相対的な強さを3段階で表す。
export type CardComponentHint = Readonly<{
  channel: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y';
  strength: 1 | 2 | 3;
}>;

// カードのDomain情報をUIがそのまま描画できる形へ変換した表示モデル。
export type GameCardViewModel = Readonly<{
  id: GameCardId;
  titleKey: string;
  titleValues?: Readonly<Record<string, string | number>>;
  backgroundColor: string;
  backgroundImage?: string;
  componentHints?: readonly CardComponentHint[];
}>;
