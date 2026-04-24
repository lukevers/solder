export type RuntimeLogLevel = 'info' | 'warn' | 'error' | 'fatal';

export type RuntimeLogEntry = {
  id: string;
  time: string;
  level: RuntimeLogLevel;
  source: string;
  message: string;
};

type RuntimeLogListener = () => void;

/**
 * Session-storage key used to persist runtime logs across same-tab reloads.
 *
 * Mobile Safari may recover from a renderer crash by reloading the page. We
 * keep the recent log ring in sessionStorage so the next boot can still show
 * what happened immediately before the refresh.
 */
const RUNTIME_LOG_STORAGE_KEY = 'solder-runtime-log';

/**
 * Maximum number of runtime log entries retained in memory and storage.
 *
 * A small ring buffer keeps the log viewer useful without letting repeated
 * worker errors or lifecycle noise grow without bound on long sessions.
 */
const MAX_RUNTIME_LOG_ENTRIES = 200;

/**
 * Maximum length for one rendered log message.
 *
 * Console payloads can include large objects or buffers. Truncating here keeps
 * sessionStorage writes cheap and prevents the log viewer from becoming
 * unreadable on small screens.
 */
const MAX_RUNTIME_LOG_MESSAGE_LENGTH = 1200;

/**
 * Internal subscriber set for the runtime-log store.
 *
 * The app uses a tiny custom store here because logs must be available before
 * React mounts and still be consumable from components later.
 */
const listeners = new Set<RuntimeLogListener>();

/**
 * In-memory snapshot of the current runtime log ring buffer.
 */
let entries: Array<RuntimeLogEntry> = [];

/**
 * Guards the one-time installation of console and window event hooks.
 */
let runtimeLoggingInstalled = false;

/**
 * Produce a stable-ish id without depending on `crypto.randomUUID()`.
 *
 * The logger itself must stay available even on older iOS builds where modern
 * crypto helpers may be missing or partially implemented.
 */
function createRuntimeLogId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

/**
 * Clamp a message to the configured storage and UI size budget.
 */
function truncateRuntimeLogMessage(message: string): string {
  if (message.length <= MAX_RUNTIME_LOG_MESSAGE_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_RUNTIME_LOG_MESSAGE_LENGTH)}…`;
}

/**
 * Notify React subscribers after the log snapshot changes.
 */
function emitRuntimeLogUpdate(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Persist the current in-memory log ring to sessionStorage.
 *
 * All storage access is wrapped defensively because Safari private mode and
 * storage-pressure conditions can throw synchronously.
 */
function persistRuntimeLogs(): void {
  try {
    window.sessionStorage.setItem(
      RUNTIME_LOG_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // Ignore storage failures. The in-memory log remains usable.
  }
}

/**
 * Load the previously persisted same-tab log ring, if any.
 */
function hydrateRuntimeLogs(): void {
  try {
    const serialized = window.sessionStorage.getItem(RUNTIME_LOG_STORAGE_KEY);
    if (!serialized) {
      return;
    }

    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return;
    }

    entries = parsed
      .filter(
        (entry): entry is RuntimeLogEntry =>
          typeof entry?.id === 'string' &&
          typeof entry?.time === 'string' &&
          typeof entry?.level === 'string' &&
          typeof entry?.source === 'string' &&
          typeof entry?.message === 'string',
      )
      .slice(-MAX_RUNTIME_LOG_ENTRIES);
  } catch {
    entries = [];
  }
}

/**
 * Convert unknown runtime values into a compact printable string.
 */
function formatRuntimeLogValue(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    value == null
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
 * Record one entry into the runtime-log ring buffer.
 */
function pushRuntimeLogEntry(
  level: RuntimeLogLevel,
  source: string,
  message: string,
): void {
  entries = [
    ...entries,
    {
      id: createRuntimeLogId(),
      time: new Date().toISOString(),
      level,
      source,
      message: truncateRuntimeLogMessage(message),
    },
  ].slice(-MAX_RUNTIME_LOG_ENTRIES);

  persistRuntimeLogs();
  emitRuntimeLogUpdate();
}

/**
 * Capture a concise boot snapshot for debugging device-specific failures.
 *
 * This is especially helpful on iOS where remote devtools are inconvenient and
 * worker / audio feature support varies across Safari versions.
 */
function logBootEnvironment(): void {
  const nav = navigator as Navigator & { standalone?: boolean };
  const sharedArrayBufferAvailable =
    typeof window.SharedArrayBuffer !== 'undefined';

  recordRuntimeLog(
    'info',
    'boot',
    [
      `ua=${navigator.userAgent}`,
      `coi=${String(window.crossOriginIsolated)}`,
      `sab=${String(sharedArrayBufferAvailable)}`,
      `standalone=${String(nav.standalone ?? false)}`,
      `visibility=${document.visibilityState}`,
      `screen=${window.innerWidth}x${window.innerHeight}`,
    ].join(' | '),
  );
}

/**
 * Install global window and console hooks for runtime diagnostics.
 *
 * The hook order matters: this runs before React mounts so bootstrap failures,
 * uncaught promise rejections, and early worker errors still land in the log
 * viewer or the fatal fallback UI.
 */
export function installRuntimeLogging(): void {
  if (runtimeLoggingInstalled) {
    return;
  }

  runtimeLoggingInstalled = true;
  hydrateRuntimeLogs();

  const originalConsole = {
    info: window.console.info.bind(window.console),
    warn: window.console.warn.bind(window.console),
    error: window.console.error.bind(window.console),
  };

  window.console.info = (...args: Array<unknown>) => {
    pushRuntimeLogEntry(
      'info',
      'console',
      args.map((value) => formatRuntimeLogValue(value)).join(' '),
    );
    originalConsole.info(...args);
  };

  window.console.warn = (...args: Array<unknown>) => {
    pushRuntimeLogEntry(
      'warn',
      'console',
      args.map((value) => formatRuntimeLogValue(value)).join(' '),
    );
    originalConsole.warn(...args);
  };

  window.console.error = (...args: Array<unknown>) => {
    pushRuntimeLogEntry(
      'error',
      'console',
      args.map((value) => formatRuntimeLogValue(value)).join(' '),
    );
    originalConsole.error(...args);
  };

  window.addEventListener('error', (event) => {
    const location = event.filename
      ? `${event.filename}:${event.lineno}:${event.colno}`
      : 'unknown location';
    const detail = event.error
      ? formatRuntimeLogValue(event.error)
      : event.message;

    pushRuntimeLogEntry('error', 'window.error', `${location} | ${detail}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    pushRuntimeLogEntry(
      'error',
      'unhandledrejection',
      formatRuntimeLogValue(event.reason),
    );
  });

  window.addEventListener('pageshow', (event) => {
    pushRuntimeLogEntry(
      'info',
      'lifecycle',
      `pageshow persisted=${String(event.persisted)}`,
    );
  });

  window.addEventListener('pagehide', (event) => {
    pushRuntimeLogEntry(
      'warn',
      'lifecycle',
      `pagehide persisted=${String(event.persisted)}`,
    );
  });

  window.addEventListener('offline', () => {
    pushRuntimeLogEntry('warn', 'network', 'offline');
  });

  window.addEventListener('online', () => {
    pushRuntimeLogEntry('info', 'network', 'online');
  });

  document.addEventListener('visibilitychange', () => {
    pushRuntimeLogEntry(
      'info',
      'lifecycle',
      `visibility=${document.visibilityState}`,
    );
  });

  logBootEnvironment();
}

/**
 * Append an app-owned diagnostic entry to the runtime log.
 *
 * Use this for worker lifecycle, audio startup, and other domain events that
 * do not naturally flow through `console` or the global error hooks.
 */
export function recordRuntimeLog(
  level: RuntimeLogLevel,
  source: string,
  message: string,
): void {
  pushRuntimeLogEntry(level, source, message);
}

/**
 * Return the latest immutable snapshot for React subscribers.
 */
export function getRuntimeLogEntries(): Array<RuntimeLogEntry> {
  return entries;
}

/**
 * Subscribe to future runtime-log updates.
 */
export function subscribeRuntimeLogs(listener: RuntimeLogListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Clear the current log ring from memory and same-tab storage.
 */
export function clearRuntimeLogs(): void {
  entries = [];

  try {
    window.sessionStorage.removeItem(RUNTIME_LOG_STORAGE_KEY);
  } catch {
    // Ignore storage failures. The in-memory clear already succeeded.
  }

  emitRuntimeLogUpdate();
}

/**
 * Render the log ring into a plain-text export suitable for clipboard sharing.
 */
export function formatRuntimeLogs(
  entriesToFormat: Array<RuntimeLogEntry>,
): string {
  return entriesToFormat
    .map(
      (entry) =>
        `[${entry.time}] ${entry.level.toUpperCase()} ${entry.source}: ${entry.message}`,
    )
    .join('\n');
}

/**
 * Render a non-React fatal fallback when bootstrap fails before the app mounts.
 *
 * This keeps the page from going blank on import-time errors and exposes the
 * captured log ring immediately, which is important on devices where the page
 * keeps refreshing before a developer can attach remote tools.
 */
export function renderBootstrapFailure(error: unknown): void {
  const root = document.getElementById('root');
  if (!root) {
    return;
  }

  const container = document.createElement('div');
  container.className =
    'min-h-screen bg-[#111827] p-4 font-mono text-sm text-gray-200';

  const title = document.createElement('h1');
  title.textContent = 'Solder failed to start';
  title.className = 'mb-3 text-base font-bold';

  const detail = document.createElement('pre');
  detail.textContent = formatRuntimeLogValue(error);
  detail.className = 'mb-4 overflow-auto rounded border border-red-500 p-3';

  const logsTitle = document.createElement('h2');
  logsTitle.textContent = 'Runtime log';
  logsTitle.className = 'mb-2 text-sm font-bold';

  const logs = document.createElement('pre');
  logs.textContent = formatRuntimeLogs(entries) || 'No runtime logs captured.';
  logs.className =
    'max-h-[60vh] overflow-auto rounded border border-gray-600 p-3 text-xs';

  container.append(title, detail, logsTitle, logs);
  root.replaceChildren(container);
}
