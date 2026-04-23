import { FolderOpen, MousePointer2, Play, X } from 'lucide-react';
import { useEffect } from 'react';
import { APP_VERSION } from '../lib/app-version';
import { Button } from './Button';
import { SolderLogo } from './SolderLogo';

type WelcomeModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Short onboarding overlay shown on a user's first visit.
 *
 * The modal stays intentionally lightweight: it explains the editor's core
 * loop, points users toward example circuits, and tells them how to reopen the
 * guide later from the app chrome.
 */
export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-stretch overflow-y-auto bg-gray-950/65 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close welcome modal"
      />

      <div className="relative z-[101] flex min-h-full w-full flex-col overflow-hidden bg-gray-900 font-sans sm:max-h-[calc(100vh-2rem)] sm:min-h-0 sm:max-w-2xl sm:rounded sm:border sm:border-gray-700 sm:shadow-2xl">
        <div className="flex items-center justify-between border-gray-800 border-b bg-gray-950 px-4 py-2">
          <SolderLogo />

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-700 bg-gray-900 p-1.5 text-gray-500 transition-colors hover:text-gray-200"
            aria-label="Close welcome modal"
          >
            <X size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid border-gray-800 border-b md:grid-cols-[1.4fr_0.9fr]">
            <div className="px-4 py-4">
              <h2 className="font-medium text-gray-100 text-lg">
                Build and simulate audio circuits.
              </h2>
              <p className="mt-2 max-w-xl text-gray-400 text-sm leading-6">
                Solder is a schematic editor for pedals and small analog
                circuits. Place parts, connect the nets, run{' '}
                <a
                  href="https://ngspice.sourceforge.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
                >
                  ngspice
                </a>
                , and compare the input signal against the output.
              </p>
            </div>

            <div className="border-gray-800 border-t bg-gray-950/50 px-4 py-4 md:border-t-0 md:border-l">
              <div className="font-sans text-[11px] text-gray-500 uppercase tracking-wider">
                Signal path
              </div>
              <div className="mt-3 rounded border border-gray-800 bg-gray-950 px-3 py-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-blue-400">INPUT</span>
                  <span className="text-gray-600">-&gt;</span>
                  <span className="text-gray-400">circuit</span>
                  <span className="text-gray-600">-&gt;</span>
                  <span className="text-green-400">OUTPUT</span>
                </div>
                <div className="mt-2 text-gray-500">
                  wire grounds, then click Simulate
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-3 border-gray-800 border-b px-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-gray-700 bg-gray-950 text-blue-300">
                <MousePointer2 size={14} />
              </div>
              <div>
                <div className="text-gray-200 text-sm">Draw the circuit</div>
                <p className="mt-1 text-gray-400 text-sm leading-6">
                  Use the top toolbar to place jacks, resistors, caps, op-amps,
                  transistors, power, and labels. Drag between handles to create
                  connections.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-gray-800 border-b px-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-gray-700 bg-gray-950 text-green-300">
                <Play size={14} />
              </div>
              <div>
                <div className="text-gray-200 text-sm">Simulate</div>
                <p className="mt-1 text-gray-400 text-sm leading-6">
                  Choose a sample on the right, click Simulate, then listen to
                  the result or inspect it in the oscilloscope waveform view
                  below the inspector.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 px-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-gray-700 bg-gray-950 text-amber-300">
                <FolderOpen size={14} />
              </div>
              <div>
                <div className="text-gray-200 text-sm">
                  Use examples when needed
                </div>
                <p className="mt-1 text-gray-400 text-sm leading-6">
                  The Examples panel loads starter pedals and reference
                  circuits. Click the Solder logo in the top-left corner any
                  time to reopen this guide.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-gray-800 border-t bg-gray-950 px-4 py-3">
          <div className="font-mono text-[11px] text-gray-500 uppercase tracking-wider">
            version: {APP_VERSION}
          </div>
          <Button onClick={onClose} size="sm" tone="neutral">
            Open Editor
          </Button>
        </div>
      </div>
    </div>
  );
}
