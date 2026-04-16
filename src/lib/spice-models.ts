// src/lib/spice-models.ts

/**
 * TL072 operational amplifier macromodel subcircuit.
 * Based on the Texas Instruments / ngspice distribution macromodel.
 * Pin order: IN+, IN-, V+, V-, OUT.
 *
 * POLY() removed for compatibility with eecircuit-engine (no XSPICE):
 *   - EGND POLY(2) → single E element: V(99,4) = 0.5*V(3,4)  [midpoint]
 *   - FB   POLY(5) → five individual F elements that sum at node 7
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
.ENDS`;

/**
 * LM741 operational amplifier macromodel subcircuit.
 * Based on the National Semiconductor macro-model.
 * Pin order: IN+, IN-, V+, V-, OUT.
 *
 * POLY() removed for compatibility with eecircuit-engine (no XSPICE):
 *   - EOS POLY(1) → E element + series offset voltage source (intermediate node eos_m)
 *   - F6  POLY(1) → F element + parallel DC current source
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
.ENDS`;

/** BJT .model statements — inline single-line definitions. */
export const BJT_2N3904 =
  '.model 2N3904 NPN(IS=6.734f BF=416.4 NF=1 VAF=74.03 IKF=66.78m ISE=6.734f NE=1.259 BR=.7389 NR=1 VAR=28 IKR=0 ISC=0 NC=2 RB=10 RE=.2267 RC=.4295 CJE=3.638p VJE=.75 MJE=.3085 TF=301.2p XTF=2 VTF=4 ITF=.4 CJC=4.082p VJC=.75 MJC=.2196 XCJC=1 FC=.5 TR=239.5p)';

export const BJT_2N3906 =
  '.model 2N3906 PNP(IS=1.41f BF=180.7 NF=1 VAF=18.7 IKF=80m ISE=0 NE=1.5 BR=4.977 NR=1 VAR=32 IKR=0 ISC=0 NC=2 RB=10 RE=.6 RC=1.5 CJE=7.19p VJE=.75 MJE=.3 TF=569.1p XTF=10 VTF=4 ITF=.6 CJC=9.53p VJC=.75 MJC=.33 XCJC=.5 FC=.5 TR=22.09n)';

export const BJT_AC128 =
  '.model AC128 PNP(IS=100n BF=100 NF=1 VAF=100 IKF=10m ISE=0.44n NE=1.2 BR=20 NR=1 VAR=20 IKR=1.2m ISC=120n NC=1.2 RB=170 RE=20 RC=60 CJE=6p VJE=0.4 MJE=0.4 TF=0.15u CJC=3.75p VJC=0.6 MJC=0.33 TR=2.86u XTB=1 EG=0.67 XTI=4)';

/** JFET .model statements */
export const JFET_2N5457 =
  '.model 2N5457 NJF(VTO=-1.8 BETA=1.813m LAMBDA=5.548m RD=1 RS=1 CGS=4.208p CGD=4.208p IS=205.8f)';

export const JFET_J201 =
  '.model J201 NJF(VTO=-0.7 BETA=1.4m LAMBDA=2.25m RD=1 RS=1 CGS=2.5p CGD=2.5p IS=100f)';

export const JFET_2N5460 =
  '.model 2N5460 PJF(VTO=1.5 BETA=1.25m LAMBDA=6m RD=1 RS=1 CGS=5p CGD=5p IS=50f)';

/** MOSFET .model statements */
export const MOSFET_BS170 =
  '.model BS170 NMOS(VTO=1.83 KP=320m LAMBDA=37.5m RD=1.2 RS=1.2 CGS=28p CGD=5p CBD=35p IS=1f)';

export const MOSFET_IRF510 =
  '.model IRF510 NMOS(VTO=3.697 KP=3.592 LAMBDA=0 RD=0.5 RS=0.5 CGS=430p CGD=100p CBD=570p IS=1f)';

export const MOSFET_IRF9510 =
  '.model IRF9510 PMOS(VTO=-3.7 KP=2.5 LAMBDA=0 RD=0.7 RS=0.7 CGS=350p CGD=90p CBD=480p IS=1f)';
