import { SpiceSubcircuit } from '../../spice';

/**
 * SPICE subcircuit definitions for op-amp models.
 *
 * These multi-line `.SUBCKT` blocks are inlined into compiled netlists when
 * the corresponding op-amp model is used in a circuit.
 *
 * All POLY() directives have been replaced with supported primitive elements
 * for eecircuit-engine compatibility.
 *
 * This file is different from the diode / BJT / FET `model.ts` files: the
 * op-amps here are not single compact `.model` cards. They are complete
 * subcircuits assembled from many primitive SPICE elements.
 *
 * Element prefixes used inside these subcircuits:
 *
 *   R
 *     Resistor instance. Final numeric token is a resistance value in ohms.
 *
 *   C
 *     Capacitor instance. Final numeric token is a capacitance value in farads.
 *
 *   L
 *     Inductor instance. Final numeric token is an inductance value in henries.
 *
 *   I
 *     Independent current source. Tokens like `DC 100U` set the source value in
 *     amps.
 *
 *   V
 *     Independent voltage source. Tokens like `DC 2.200` set the source value in
 *     volts.
 *
 *   D
 *     Diode instance referencing an internal diode model such as `DX`.
 *
 *   Q
 *     BJT instance referencing an internal BJT model such as `QX`.
 *
 *   J
 *     JFET instance referencing an internal JFET model such as `JX`.
 *
 *   E
 *     Voltage-controlled voltage source (VCVS). The final numeric token is the
 *     gain in volts per volt.
 *
 *   G
 *     Voltage-controlled current source (VCCS). The final numeric token is the
 *     trans-conductance in amps per volt.
 *
 *   F
 *     Current-controlled current source (CCCS). The final numeric token is the
 *     current gain.
 *
 * Embedded compact-model parameters used inside the subcircuits:
 *
 *   DX uses diode parameter:
 *     IS
 *       Saturation current.
 *
 *   JX uses JFET parameters:
 *     IS
 *       Gate-junction saturation current.
 *     BETA
 *       Transconductance scale factor.
 *     VTO
 *       Pinch-off / threshold-style voltage.
 *
 *   QX uses BJT parameter:
 *     BF
 *       Forward beta.
 *
 * @see https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 */

/**
 * TL072 operational amplifier macromodel.
 *
 * Pin order: IN+, IN-, V+, V-, OUT.
 *
 * @see ./datasheets/tl072.pdf
 */
export const TL072_SUBCKT = new SpiceSubcircuit(
  `* TL072 OPERATIONAL AMPLIFIER "MACROMODEL" SUBCIRCUIT
* CONNECTIONS:   NON-INVERTING INPUT
*                | INVERTING INPUT
*                | | POSITIVE POWER SUPPLY
*                | | | NEGATIVE POWER SUPPLY
*                | | | | OUTPUT
*                | | | | |
.SUBCKT TL072    1 2 3 4 5
  C1   11 12 3.498E-12
  C2    6  7 15.00E-12
  DC    5 53 DX
  DE   54  5 DX
  DLP  90 91 DX
  DLN  92 90 DX
  DP    4  3 DX
  EGND 99  4 3  4 0.5
  FB1   7 99 VB  4.715E6
  FB2   7 99 VC -5E6
  FB3   7 99 VE  5E6
  FB4   7 99 VLP 5E6
  FB5   7 99 VLN -5E6
  GA    6  0 11 12 282.8E-6
  GCM   0  6 10 99 8.942E-9
  ISS   3 10 DC 195.0E-6
  HLIM 90  0 VLIM 1K
  J1   11  2 10 JX
  J2   12  1 10 JX
  R2    6  9 100.0E3
  RD1   4 11 3.536E3
  RD2   4 12 3.536E3
  RO1   8  5 150
  RO2   7 99 150
  RP    3  4 2.143E3
  RSS  10 99 1.026E6
  VB    9  0 DC 0
  VC    3 53 DC 2.200
  VE   54  4 DC 2.200
  VLIM  7  8 DC 0
  VLP  91  0 DC 25
  VLN   0 92 DC 25
.MODEL DX D(IS=800.0E-18)
.MODEL JX PJF(IS=15.00E-12 BETA=270.1E-6 VTO=-1)
.ENDS`,
);

/**
 * LM741 operational amplifier macromodel.
 *
 * Pin order: IN+, IN-, V+, V-, OUT.
 *
 * @see ./datasheets/lm741.pdf
 */
export const LM741_SUBCKT = new SpiceSubcircuit(
  `* LM741 OPERATIONAL AMPLIFIER MACRO-MODEL
* CONNECTIONS:   NON-INVERTING INPUT
*                | INVERTING INPUT
*                | | POSITIVE POWER SUPPLY
*                | | | NEGATIVE POWER SUPPLY
*                | | | | OUTPUT
*                | | | | |
.SUBCKT LM741    1 2 99 50 28
IOS 2 1 20N
R1 1 3 250K
R2 3 2 250K
I1 4 50 100U
R3 5 99 517
R4 6 99 517
Q1 5 2 4 QX
Q2 6 7 4 QX
C4 5 6 60.3614P
I2 99 50 1.6MA
EOS_vc 7 eos_m 16 49 1
VEOS_os eos_m 1 1E-3
R8 99 49 40K
R9 49 50 40K
V2 99 8 1.63
D1 9 8 DX
D2 10 9 DX
V3 10 50 1.63
EH 99 98 99 49 1
G1 98 9 5 6 2.1E-3
R5 98 9 95.493MEG
C3 98 9 333.33P
G3 98 15 9 49 1E-6
R12 98 15 1MEG
C5 98 15 5.3052E-15
G4 98 16 3 49 3.1623E-8
L2 98 17 530.5M
R13 17 16 1K
F6a 50 99 V6 1
IF6b 50 99 DC 450U
E1 99 23 99 15 1
R16 24 23 25
D5 26 24 DX
V6 26 22 0.65V
R17 23 25 25
D6 25 27 DX
V7 22 27 0.65V
V5 22 21 0.18V
D4 21 15 DX
V4 20 22 0.18V
D3 15 20 DX
L3 22 28 100P
RL3 22 28 100K
.MODEL DX D(IS=1E-15)
.MODEL QX NPN(BF=625)
.ENDS`,
);

/**
 * LM308 operational amplifier macromodel.
 *
 * Exposes pins 1 and 8 so the external compensation capacitor used in
 * RAT-style circuits can be simulated.
 *
 * @see ./datasheets/LM108.pdf
 */
export const LM308_SUBCKT = new SpiceSubcircuit(
  `* LM308 OPERATIONAL AMPLIFIER MACRO-MODEL
* DIP-8 PINS:    Null- IN- IN+ V-  OUT  V+  Comp/NC
*                p1    p2  p3  p4   p6  p7   p8
*
* p1 (pin 1) = emitter-tail node of input pair
* p8 (pin 8) = dominant-pole node; connect 47pF cap p1→p8 for compensation
.SUBCKT LM308    p1 p2 p3 p4 p6 p7 p8
IOS p2 p3 500P
R1 p3 3 20MEG
R2 3 p2 20MEG
I1 p1 p4 6U
R3 5 p7 33.33K
R4 6 p7 33.33K
Q1 5 p2 p1 QX
Q2 6 7 p1 QX
C4 5 6 30P
I2 p7 p4 2MA
EOS_vc 7 eos_m 16 49 1
VEOS_os eos_m p3 500U
R8 p7 49 40K
R9 49 p4 40K
V2 p7 cnh 1.5
D1 p8 cnh DX
D2 10 p8 DX
V3 10 p4 1.5
EH p7 98 p7 49 1
G1 98 p8 5 6 115.4U
R5 98 p8 86.6MEG
C3 98 p8 30P
G3 98 15 p8 49 1E-6
R12 98 15 1MEG
C5 98 15 30P
G4 98 16 3 49 1E-8
L2 98 17 530.5M
R13 17 16 1K
F6a p4 p7 V6 1
IF6b p4 p7 DC 450U
E1 p7 23 p7 15 1
R16 24 23 25
D5 26 24 DX
V6 26 22 0.65V
R17 23 25 25
D6 25 27 DX
V7 22 27 0.65V
V5 22 21 0.18V
D4 21 15 DX
V4 20 22 0.18V
D3 15 20 DX
L3 22 p6 100P
RL3 22 p6 100K
.MODEL DX D(IS=1E-15)
.MODEL QX NPN(BF=5000)
.ENDS`,
);
