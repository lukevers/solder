import { Copy, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  clearRuntimeLogs,
  formatRuntimeLogs,
  getRuntimeLogEntries,
  type RuntimeLogLevel,
  subscribeRuntimeLogs,
} from '../lib/runtime-log';

/**
 * Accent colors for each runtime log severity.
 *
 * The viewer keeps the palette explicit here so errors remain immediately
 * visible on the dense monospace panel without relying on surrounding layout
 * context.
 */
const LOG_LEVEL_CLASS = {
  info: 'text-sky-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  fatal: 'text-fuchsia-400',
} as const;

/**
 * Ordered severity list used by the filter toolbar.
 *
 * Keeping the level order explicit avoids UI drift between the button row and
 * the rendered entry badges.
 */
const LOG_LEVELS: Array<RuntimeLogLevel> = ['info', 'warn', 'error', 'fatal'];

/**
 * Default severity filters shown when the panel first opens.
 *
 * Informational lifecycle noise is often high-volume, so the viewer starts by
 * focusing on warnings and failures while still allowing info logs to be
 * enabled on demand.
 */
const DEFAULT_ENABLED_LEVELS: Array<RuntimeLogLevel> = [
  'warn',
  'error',
  'fatal',
];

/**
 * Floating viewer for same-tab runtime logs.
 *
 * This gives touch devices a way to inspect bootstrap, worker, and lifecycle
 * failures without attaching Safari remote devtools.
 */
export function RuntimeLogPanel() {
  const entries = useSyncExternalStore(
    subscribeRuntimeLogs,
    getRuntimeLogEntries,
    getRuntimeLogEntries,
  );
  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'done' | 'failed'>(
    'idle',
  );
  const [enabledLevels, setEnabledLevels] = useState<Array<RuntimeLogLevel>>(
    DEFAULT_ENABLED_LEVELS,
  );

  const errorCount = useMemo(() => {
    return entries.filter(
      (entry) => entry.level === 'error' || entry.level === 'fatal',
    ).length;
  }, [entries]);

  /**
   * Count entries per level for the filter buttons.
   */
  const levelCounts = useMemo(() => {
    return LOG_LEVELS.reduce(
      (counts, level) => {
        counts[level] = entries.filter((entry) => entry.level === level).length;
        return counts;
      },
      {} as Record<RuntimeLogLevel, number>,
    );
  }, [entries]);

  /**
   * Apply the currently-enabled severity filters to the full log ring.
   */
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => enabledLevels.includes(entry.level));
  }, [enabledLevels, entries]);

  /**
   * Surface the panel automatically when the session already contains errors.
   *
   * This is primarily for crash-recovery reloads on mobile Safari, where the
   * user lands back on the app without seeing the original exception.
   */
  useEffect(() => {
    if (errorCount === 0) {
      return;
    }

    setOpen(true);
  }, [errorCount]);

  /**
   * Reset the transient clipboard status label after a short delay.
   */
  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyStatus('idle');
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyStatus]);

  /**
   * Copy the current log export to the system clipboard.
   */
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(formatRuntimeLogs(filteredEntries));
      setCopyStatus('done');
    } catch {
      setCopyStatus('failed');
    }
  }

  /**
   * Toggle one severity level in the active filter set.
   *
   * We keep at least one level enabled so the panel never lands in a state
   * where every button is off and the list appears broken.
   */
  function toggleLevel(level: RuntimeLogLevel): void {
    setEnabledLevels((currentLevels) => {
      if (currentLevels.includes(level)) {
        if (currentLevels.length === 1) {
          return currentLevels;
        }

        return currentLevels.filter((currentLevel) => currentLevel !== level);
      }

      return LOG_LEVELS.filter((currentLevel) => {
        return currentLevel === level || currentLevels.includes(currentLevel);
      });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded border px-2 py-0.5 font-mono text-xs transition-colors ${
          errorCount > 0
            ? 'border-red-700 bg-red-950/60 text-red-300 hover:bg-red-950'
            : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
        }`}
      >
        logs {entries.length}
        {errorCount > 0 ? ` · ${errorCount} err` : ''}
      </button>

      {open && (
        <div className="fixed inset-3 z-[10000] flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-950 shadow-2xl">
          <div className="flex items-center gap-2 border-gray-800 border-b px-3 py-2 font-mono text-xs">
            <span className="text-gray-200">runtime log</span>
            <span className="text-gray-500">
              {filteredEntries.length}/{entries.length} entries
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-gray-400 transition-colors hover:text-gray-200"
            >
              <Copy size={12} />
              {copyStatus === 'done'
                ? 'copied'
                : copyStatus === 'failed'
                  ? 'copy failed'
                  : 'copy'}
            </button>
            <button
              type="button"
              onClick={() => clearRuntimeLogs()}
              className="flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-gray-400 transition-colors hover:text-gray-200"
            >
              <Trash2 size={12} />
              clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-gray-400 transition-colors hover:text-gray-200"
              aria-label="Close runtime log"
            >
              <X size={12} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 border-gray-800 border-b px-3 py-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setEnabledLevels(LOG_LEVELS)}
              className={`rounded border px-2 py-1 transition-colors ${
                enabledLevels.length === LOG_LEVELS.length
                  ? 'border-gray-500 bg-gray-800 text-gray-100'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              all {entries.length}
            </button>

            {LOG_LEVELS.map((level) => {
              const enabled = enabledLevels.includes(level);

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`rounded border px-2 py-1 transition-colors ${
                    enabled
                      ? 'border-gray-500 bg-gray-800 text-gray-100'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className={LOG_LEVEL_CLASS[level]}>{level}</span>{' '}
                  {levelCounts[level]}
                </button>
              );
            })}
          </div>

          <div className="overflow-y-auto p-3 font-mono text-xs">
            {entries.length === 0 ? (
              <div className="text-gray-500">No runtime logs captured yet.</div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-gray-500">
                No runtime logs match the active filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded border border-gray-800 bg-gray-900/70 p-2"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-gray-500">{entry.time}</span>
                      <span className={LOG_LEVEL_CLASS[entry.level]}>
                        {entry.level}
                      </span>
                      <span className="text-gray-300">{entry.source}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-gray-200">
                      {entry.message}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
