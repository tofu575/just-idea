import type { Color } from '../../domain/models/color/Color';
import { Hand } from '../../domain/models/hand/Hand';
import { ScoreTarget } from '../../domain/models/rules/ScorePolicy';
import {
  ColorRiskLevel,
  type ColorRiskViewModel,
} from '../models/ColorRiskViewModel';

const RISK_START_RATIO = 0.5;
const DANGER_START_RATIO = 0.8;

// 目標方向へ進んだ割合を、数値を露出しない3段階の危険度へ変換する。
function calculateRiskLevel(
  channelValue: number,
  target: ScoreTarget,
): ColorRiskLevel {
  const progress =
    target === ScoreTarget.White
      ? channelValue / Hand.CHANNEL_LIMIT
      : (Hand.CHANNEL_LIMIT - channelValue) / Hand.CHANNEL_LIMIT;

  if (progress >= DANGER_START_RATIO) return ColorRiskLevel.Danger;
  if (progress >= RISK_START_RATIO) return ColorRiskLevel.Risk;
  return ColorRiskLevel.Safe;
}

// 現在色からRGB各成分の境界への近さを表示用モデルへ変換する。
export function createColorRiskViewModel(
  color: Color,
  target: ScoreTarget,
): readonly ColorRiskViewModel[] {
  const channels =
    target === ScoreTarget.White
      ? ({ red: 'R', green: 'G', blue: 'B' } as const)
      : ({ red: 'C', green: 'M', blue: 'Y' } as const);

  return [
    { channel: channels.red, level: calculateRiskLevel(color.red, target) },
    {
      channel: channels.green,
      level: calculateRiskLevel(color.green, target),
    },
    { channel: channels.blue, level: calculateRiskLevel(color.blue, target) },
  ];
}
