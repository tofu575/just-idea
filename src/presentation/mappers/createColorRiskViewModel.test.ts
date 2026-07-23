import { describe, expect, it } from 'vitest';
import { ScoreTarget } from '../../domain/models/rules/ScorePolicy';
import { createColor } from '../../test/helpers/createDomainValue';
import { ColorRiskLevel } from '../models/ColorRiskViewModel';
import { createColorRiskViewModel } from './createColorRiskViewModel';

describe('createColorRiskViewModel', () => {
  it('白へ進むルールでは上限へ近づくほど危険度を上げる', () => {
    const risks = createColorRiskViewModel(
      createColor(100, 128, 204),
      ScoreTarget.White,
    );

    expect(risks).toEqual([
      { channel: 'R', level: ColorRiskLevel.Safe },
      { channel: 'G', level: ColorRiskLevel.Risk },
      { channel: 'B', level: ColorRiskLevel.Danger },
    ]);
  });

  it('黒へ進むルールでは下限へ近づくほど危険度を上げる', () => {
    const risks = createColorRiskViewModel(
      createColor(155, 127, 51),
      ScoreTarget.Black,
    );

    expect(risks).toEqual([
      { channel: 'C', level: ColorRiskLevel.Safe },
      { channel: 'M', level: ColorRiskLevel.Risk },
      { channel: 'Y', level: ColorRiskLevel.Danger },
    ]);
  });
});
