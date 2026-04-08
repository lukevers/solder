// src/lib/spice-models.ts

/**
 * TL072 operational amplifier macromodel subcircuit.
 * Created using PARTS Release 4.01. Pin order: IN+, IN-, V+, V-, OUT.
 * Source: Texas Instruments / ngspice distribution.
 */
export const TL072_SUBCKT = `* TL072 OPERATIONAL AMPLIFIER "MACROMODEL" SUBCIRCUIT
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
  EGND 99  0 POLY(2) (3,0) (4,0) 0 .5 .5
  FB    7 99 POLY(5) VB VC VE VLP VLN 0 4.715E6 -5E6 5E6 5E6 -5E6
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
.ENDS`;

/**
 * LM741 operational amplifier macromodel subcircuit.
 * National Semiconductor macro-model. Pin order: IN+, IN-, V+, V-, OUT.
 * Source: National Semiconductor / ngspice distribution.
 */
export const LM741_SUBCKT = `* LM741 OPERATIONAL AMPLIFIER MACRO-MODEL
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
EOS 7 1 POLY(1) 16 49 1E-3 1
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
F6 50 99 POLY(1) V6 450U 1
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
.ENDS`;
