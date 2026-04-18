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

/**
 * LM308 operational amplifier macromodel subcircuit.
 * Based on the National Semiconductor precision op-amp macromodel.
 *
 * Physical DIP-8 pin order (pins 1–4 left, 6–8 right; pin 5/Null+ not exposed):
 *   p1 = pin 1  Null−       ← mapped to internal emitter-tail node
 *   p2 = pin 2  IN−
 *   p3 = pin 3  IN+
 *   p4 = pin 4  V−
 *   p6 = pin 6  OUT
 *   p7 = pin 7  V+
 *   p8 = pin 8  Comp/NC     ← mapped to internal dominant-pole node
 *
 * Pins 1 and 8 are exposed so external compensation components work in
 * simulation. A 47 pF cap from p1→p8 (emitter-tail→dominant-pole) is the
 * standard RAT pedal frequency-compensation configuration.
 *
 * POLY() removed for compatibility with eecircuit-engine (no XSPICE):
 *   - EOS POLY(1) → E element + series offset voltage source (eos_m node)
 *   - F6  POLY(1) → F element + parallel DC current source
 * 1G replaced with 1000Meg where needed.
 *
 * Internal node rename vs. original 5-port model:
 *   old port "1"  (IN+)          → p3
 *   old port "2"  (IN−)          → p2
 *   old port "99" (V+)           → p7
 *   old port "50" (V−)           → p4
 *   old port "28" (OUT)          → p6
 *   old internal node "4" (emitter tail)  → p1  (now an exposed port)
 *   old internal node "9" (dominant pole) → p8  (now an exposed port)
 *   old internal node "8" (V2 clamp)      → cnh (renamed to avoid p8 confusion)
 */
export const LM308_SUBCKT = `* LM308 OPERATIONAL AMPLIFIER MACRO-MODEL
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
.ENDS`;

/** BJT .model statements — inline single-line definitions. */
export const BJT_2N5088 =
  '.model 2N5088 NPN(IS=5.911f ISE=5.911f NF=1 BF=1122 NE=1.394 BR=1.271 NR=1 IKF=14.92m VAF=62.37 VAR=21.5 RC=1.61 RE=0.15 RB=10 CJE=4.973p CJC=4.017p VJE=0.65 VJC=0.65 MJE=0.4146 MJC=0.3174 TF=821.7p TR=4.673n FC=0.5)';

export const BJT_2N5089 =
  '.model 2N5089 NPN(IS=5.911f ISE=5.911f NF=1 BF=1434 NE=1.421 BR=1.262 NR=1 IKF=15.4m VAF=62.37 VAR=21.5 RC=1.61 RE=0.15 RB=10 CJE=4.973p CJC=4.017p VJE=0.75 VJC=0.75 MJE=0.4146 MJC=0.3174 TF=822.3p TR=4.671n FC=0.5)';

export const BJT_BC108 =
  '.model BC108 NPN(IS=1.8f ISE=50f NF=0.9955 NE=1.46 BF=400 BR=35.5 NR=1.005 VAF=80 IKF=0.14 IKR=0.03 NC=1.27 RB=0.56 RE=0.6 RC=0.25 CJE=13p CJC=4p VJE=0.65 VJC=0.54 MJE=0.55 MJC=0.33 TF=640p TR=50.7n FC=0.5)';

export const BJT_BC549 =
  '.model BC549 NPN(IS=10f ISE=36f NF=1 NE=1.5 BF=420 BR=5 NR=1 VAF=50 IKF=0.1 RB=120 RE=0.5 RC=0.5 CJE=10.85p CJC=4.75p VJE=0.65 VJC=0.65 MJE=0.36 MJC=0.36 TF=410p TR=10n FC=0.5)';

export const BJT_MPSA18 =
  '.model MPSA18 NPN(IS=20.3f ISE=1.41p NF=1 NE=2 BF=1430 BR=4 NR=1 VAF=120 VAR=26 IKF=0.12 IKR=0.18 RC=0.186 RE=0.465 RB=1.86 CJE=7.87p CJC=5.2p VJE=1.1 VJC=0.3 MJE=0.5 MJC=0.3 TF=353p TR=245n FC=0.5)';

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

export const JFET_J113 =
  '.model J113 NJF(VTO=-1.29 BETA=9.26m LAMBDA=30.4m RD=1.3 RS=1.3 CGS=10.5p CGD=12p IS=987f)';

export const JFET_MPF102 =
  '.model MPF102 NJF(VTO=-3.5 BETA=4m LAMBDA=2m RD=1 RS=1 CGS=4p CGD=3p IS=100f)';

export const JFET_2N5460 =
  '.model 2N5460 PJF(VTO=1.5 BETA=1.25m LAMBDA=6m RD=1 RS=1 CGS=5p CGD=5p IS=50f)';

/** MOSFET .model statements */
export const MOSFET_BS170 =
  '.model BS170 NMOS(VTO=1.83 KP=320m LAMBDA=37.5m RD=1.2 RS=1.2 CGS=28p CGD=5p CBD=35p IS=1f)';

export const MOSFET_IRF510 =
  '.model IRF510 NMOS(VTO=3.697 KP=3.592 LAMBDA=0 RD=0.5 RS=0.5 CGS=430p CGD=100p CBD=570p IS=1f)';

export const MOSFET_IRF9510 =
  '.model IRF9510 PMOS(VTO=-3.7 KP=2.5 LAMBDA=0 RD=0.7 RS=0.7 CGS=350p CGD=90p CBD=480p IS=1f)';

export const MOSFET_2N7000 =
  '.model 2N7000 NMOS(VTO=2.1 KP=190m LAMBDA=5m RD=1.5 RS=1.5 CGS=25p CGD=5p CBD=30p IS=1f)';
