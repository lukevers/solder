// SPICE .model statements for transistors.
//
// Each constant is a single-line ngspice `.model`
// directive that gets included in compiled netlists
// when the corresponding transistor is used.

// ── BJT models ───────────────────────────────────────────

/**
 * 2N5088 — high-gain NPN silicon transistor.
 * BF ≈ 1122. Popular in fuzz and boost circuits
 * for its high hFE.
 */
export const BJT_2N5088 =
  '.model 2N5088 NPN(IS=5.911f ISE=5.911f NF=1 BF=1122 NE=1.394 BR=1.271 NR=1 IKF=14.92m VAF=62.37 VAR=21.5 RC=1.61 RE=0.15 RB=10 CJE=4.973p CJC=4.017p VJE=0.65 VJC=0.65 MJE=0.4146 MJC=0.3174 TF=821.7p TR=4.673n FC=0.5)';

/**
 * 2N5089 — ultra-high-gain NPN silicon transistor.
 * BF ≈ 1434. Even higher gain than the 2N5088,
 * used in the same types of circuits.
 */
export const BJT_2N5089 =
  '.model 2N5089 NPN(IS=5.911f ISE=5.911f NF=1 BF=1434 NE=1.421 BR=1.262 NR=1 IKF=15.4m VAF=62.37 VAR=21.5 RC=1.61 RE=0.15 RB=10 CJE=4.973p CJC=4.017p VJE=0.75 VJC=0.75 MJE=0.4146 MJC=0.3174 TF=822.3p TR=4.671n FC=0.5)';

/**
 * BC108 — general-purpose NPN silicon transistor.
 * BF ≈ 400. Common in vintage British-style
 * fuzz circuits.
 */
export const BJT_BC108 =
  '.model BC108 NPN(IS=1.8f ISE=50f NF=0.9955 NE=1.46 BF=400 BR=35.5 NR=1.005 VAF=80 IKF=0.14 IKR=0.03 NC=1.27 RB=0.56 RE=0.6 RC=0.25 CJE=13p CJC=4p VJE=0.65 VJC=0.54 MJE=0.55 MJC=0.33 TF=640p TR=50.7n FC=0.5)';

/**
 * BC549 — low-noise NPN silicon transistor.
 * BF ≈ 420. Used in preamp and gain stages
 * where low noise is important.
 */
export const BJT_BC549 =
  '.model BC549 NPN(IS=10f ISE=36f NF=1 NE=1.5 BF=420 BR=5 NR=1 VAF=50 IKF=0.1 RB=120 RE=0.5 RC=0.5 CJE=10.85p CJC=4.75p VJE=0.65 VJC=0.65 MJE=0.36 MJC=0.36 TF=410p TR=10n FC=0.5)';

/**
 * MPSA18 — ultra-high-gain NPN silicon transistor.
 * BF ≈ 1430. Excellent for high-impedance
 * input buffers and low-level amplification.
 */
export const BJT_MPSA18 =
  '.model MPSA18 NPN(IS=20.3f ISE=1.41p NF=1 NE=2 BF=1430 BR=4 NR=1 VAF=120 VAR=26 IKF=0.12 IKR=0.18 RC=0.186 RE=0.465 RB=1.86 CJE=7.87p CJC=5.2p VJE=1.1 VJC=0.3 MJE=0.5 MJC=0.3 TF=353p TR=245n FC=0.5)';

/**
 * 2N3904 — general-purpose NPN silicon transistor.
 * BF ≈ 416. One of the most common transistors
 * in hobby electronics and guitar effects.
 */
export const BJT_2N3904 =
  '.model 2N3904 NPN(IS=6.734f BF=416.4 NF=1 VAF=74.03 IKF=66.78m ISE=6.734f NE=1.259 BR=.7389 NR=1 VAR=28 IKR=0 ISC=0 NC=2 RB=10 RE=.2267 RC=.4295 CJE=3.638p VJE=.75 MJE=.3085 TF=301.2p XTF=2 VTF=4 ITF=.4 CJC=4.082p VJC=.75 MJC=.2196 XCJC=1 FC=.5 TR=239.5p)';

/**
 * 2N3906 — general-purpose PNP silicon transistor.
 * BF ≈ 181. The PNP complement of the 2N3904.
 * Used in push-pull stages and PNP fuzz circuits.
 */
export const BJT_2N3906 =
  '.model 2N3906 PNP(IS=1.41f BF=180.7 NF=1 VAF=18.7 IKF=80m ISE=0 NE=1.5 BR=4.977 NR=1 VAR=32 IKR=0 ISC=0 NC=2 RB=10 RE=.6 RC=1.5 CJE=7.19p VJE=.75 MJE=.3 TF=569.1p XTF=10 VTF=4 ITF=.6 CJC=9.53p VJC=.75 MJC=.33 XCJC=.5 FC=.5 TR=22.09n)';

/**
 * AC128 — germanium PNP transistor.
 * BF ≈ 100. Known for its warm, vintage tone.
 * Used in classic germanium fuzz circuits
 * (e.g. Fuzz Face).
 */
export const BJT_AC128 =
  '.model AC128 PNP(IS=100n BF=100 NF=1 VAF=100 IKF=10m ISE=0.44n NE=1.2 BR=20 NR=1 VAR=20 IKR=1.2m ISC=120n NC=1.2 RB=170 RE=20 RC=60 CJE=6p VJE=0.4 MJE=0.4 TF=0.15u CJC=3.75p VJC=0.6 MJC=0.33 TR=2.86u XTB=1 EG=0.67 XTI=4)';

// ── JFET models ──────────────────────────────────────────

/**
 * 2N5457 — N-channel JFET.
 * VTO ≈ −1.8V. General-purpose JFET used in
 * buffer and amplifier stages.
 */
export const JFET_2N5457 =
  '.model 2N5457 NJF(VTO=-1.8 BETA=1.813m LAMBDA=5.548m RD=1 RS=1 CGS=4.208p CGD=4.208p IS=205.8f)';

/**
 * 2N5458 — N-channel JFET.
 * VTO ≈ −3.5V. Higher pinch-off voltage than
 * the 2N5457, used in similar applications.
 */
export const JFET_2N5458 =
  '.model 2N5458 NJF(VTO=-3.5 BETA=2.235m LAMBDA=5.548m RD=1 RS=1 CGS=4.5p CGD=4.5p IS=205.8f)';

/**
 * J201 — N-channel JFET.
 * VTO ≈ −0.7V. Very low pinch-off voltage.
 * Popular in DIY guitar pedal buffers and
 * boost circuits.
 */
export const JFET_J201 =
  '.model J201 NJF(VTO=-0.7 BETA=1.4m LAMBDA=2.25m RD=1 RS=1 CGS=2.5p CGD=2.5p IS=100f)';

/**
 * J113 — N-channel JFET.
 * VTO ≈ −1.29V. Higher transconductance than
 * the J201. Used in high-impedance buffers.
 */
export const JFET_J113 =
  '.model J113 NJF(VTO=-1.29 BETA=9.26m LAMBDA=30.4m RD=1.3 RS=1.3 CGS=10.5p CGD=12p IS=987f)';

/**
 * MPF102 — N-channel JFET.
 * VTO ≈ −3.5V. Classic general-purpose JFET
 * found in many vintage effects schematics.
 */
export const JFET_MPF102 =
  '.model MPF102 NJF(VTO=-3.5 BETA=4m LAMBDA=2m RD=1 RS=1 CGS=4p CGD=3p IS=100f)';

/**
 * 2N5460 — P-channel JFET.
 * VTO ≈ +1.5V. Used in current sources and
 * some boutique designs requiring P-channel
 * operation.
 */
export const JFET_2N5460 =
  '.model 2N5460 PJF(VTO=1.5 BETA=1.25m LAMBDA=6m RD=1 RS=1 CGS=5p CGD=5p IS=50f)';

// ── MOSFET models ────────────────────────────────────────

/**
 * BS170 — N-channel enhancement MOSFET.
 * VTO ≈ 1.83V. Small-signal MOSFET used in
 * switching and low-power amplifier stages.
 */
export const MOSFET_BS170 =
  '.model BS170 NMOS(VTO=1.83 KP=320m LAMBDA=37.5m RD=1.2 RS=1.2 CGS=28p CGD=5p CBD=35p IS=1f)';

/**
 * IRF510 — N-channel power MOSFET.
 * VTO ≈ 3.7V. Higher power handling, used in
 * output stages and power amp simulations.
 */
export const MOSFET_IRF510 =
  '.model IRF510 NMOS(VTO=3.697 KP=3.592 LAMBDA=0 RD=0.5 RS=0.5 CGS=430p CGD=100p CBD=570p IS=1f)';

/**
 * IRF9510 — P-channel power MOSFET.
 * VTO ≈ −3.7V. The P-channel complement of
 * the IRF510. Used in complementary output
 * stages.
 */
export const MOSFET_IRF9510 =
  '.model IRF9510 PMOS(VTO=-3.7 KP=2.5 LAMBDA=0 RD=0.7 RS=0.7 CGS=350p CGD=90p CBD=480p IS=1f)';

/**
 * 2N7000 — N-channel enhancement MOSFET.
 * VTO ≈ 2.1V. Common small-signal MOSFET used
 * in switching and logic-level applications.
 */
export const MOSFET_2N7000 =
  '.model 2N7000 NMOS(VTO=2.1 KP=190m LAMBDA=5m RD=1.5 RS=1.5 CGS=25p CGD=5p CBD=30p IS=1f)';
