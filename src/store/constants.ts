/**
 * Runtime values for simulation lifecycle state.
 *
 * These strings flow through the store, status UI, and background workers.
 * Centralizing them avoids typos in status comparisons and keeps the union
 * types derived from the same source of truth.
 */
export const SIMULATION_STATUS = {
  idle: 'idle',
  running: 'running',
  error: 'error',
} as const;

/**
 * Union type for the simulation lifecycle.
 */
export type SimulationStatus =
  (typeof SIMULATION_STATUS)[keyof typeof SIMULATION_STATUS];

/**
 * Runtime values for pot-sweep lifecycle state.
 *
 * Sweep UI and worker orchestration both branch on these values, so they
 * should not be repeated inline across the app.
 */
export const SWEEP_STATUS = {
  idle: 'idle',
  running: 'running',
  done: 'done',
} as const;

/**
 * Union type for the sweep lifecycle.
 */
export type SweepStatus = (typeof SWEEP_STATUS)[keyof typeof SWEEP_STATUS];

/**
 * Provenance kinds for open tabs.
 *
 * The store uses these to decide whether a seeded tab may be replaced by a
 * clicked example or should instead preserve the current workspace.
 */
export const TAB_ORIGIN_KIND = {
  custom: 'custom',
  starter: 'starter',
  example: 'example',
} as const;
