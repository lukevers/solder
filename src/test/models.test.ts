import { describe, expect, it } from 'vitest';
import {
  BJT_2N3904,
  DIODE_1N34A,
  DIODE_1N914,
  JFET_J201,
  LM741_SUBCKT,
  MOSFET_BS170,
} from '../lib/models';
import {
  DiodeModel,
  IS_SATURATION_CURRENT,
  RS_SERIES_RESISTANCE,
} from '../lib/models/components/diode/model';

describe('SPICE model builders', () => {
  it('serializes diode models to .model lines', () => {
    expect(DIODE_1N914.toString()).toBe(
      '.model 1N914 D(IS=2.52n RS=.568 N=1.752 CJO=4p M=.4 TT=20n)',
    );
    expect(DIODE_1N34A.toString()).toBe(
      '.model 1N34A D(IS=500n RS=1.5 N=1.08 CJO=1p M=.5 TT=50n BV=65)',
    );
  });

  it('serializes BJT models to .model lines', () => {
    expect(BJT_2N3904.toString()).toContain('.model 2N3904 NPN(');
    expect(BJT_2N3904.toString()).toContain('BF=416.4');
    expect(BJT_2N3904.toString()).toContain('XCJC=1');
  });

  it('serializes JFET models to .model lines', () => {
    expect(JFET_J201.toString()).toBe(
      '.model J201 NJF(VTO=-0.7 BETA=1.4m LAMBDA=2.25m RD=1 RS=1 CGS=2.5p CGD=2.5p IS=100f)',
    );
  });

  it('serializes MOSFET models to .model lines', () => {
    expect(MOSFET_BS170.toString()).toBe(
      '.model BS170 NMOS(VTO=1.83 KP=320m LAMBDA=37.5m RD=1.2 RS=1.2 CBD=35p IS=1f)',
    );
  });

  it('wraps subcircuits behind the same toString interface', () => {
    expect(LM741_SUBCKT.toString()).toContain('.SUBCKT LM741');
    expect(LM741_SUBCKT.toString()).toContain('.ENDS');
  });

  it('allows parameters to be changed before serialization', () => {
    const diode = new DiodeModel('TESTD', {
      [IS_SATURATION_CURRENT]: '1n',
      [RS_SERIES_RESISTANCE]: '10m',
    });

    diode.params[RS_SERIES_RESISTANCE] = '20m';

    expect(diode.toString()).toBe('.model TESTD D(IS=1n RS=20m)');
  });
});
