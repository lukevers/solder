import { ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EXAMPLE_CATEGORY, type ExampleCategory } from '../examples';
import type { CircuitMetadata } from '../lib/circuit-metadata';
import { normalizeCircuitMetadata } from '../lib/circuit-metadata';
import { Button } from './Button';

type CircuitMetadataModalProps = {
  open: boolean;
  metadata: CircuitMetadata | null;
  onClose: () => void;
  onSave: (metadata: CircuitMetadata) => void;
};

/**
 * Select options exposed for the circuit category field.
 *
 * The values come from the shared examples category constants so the editor
 * form and the examples browser stay aligned on the same category ids.
 */
const CATEGORY_OPTIONS = [
  { value: EXAMPLE_CATEGORY.pedals, label: 'Pedals' },
  { value: EXAMPLE_CATEGORY.circuits, label: 'Circuits' },
] as const;

/**
 * Circuit-metadata editor used from the tab strip.
 *
 * Double-clicking a tab title opens this form so the user can edit the same
 * metadata that is persisted into exported circuit JSON.
 */
export function CircuitMetadataModal({
  open,
  metadata,
  onClose,
  onSave,
}: CircuitMetadataModalProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [draftCategory, setDraftCategory] = useState<ExampleCategory>(
    EXAMPLE_CATEGORY.circuits,
  );

  useEffect(() => {
    if (!open || !metadata) {
      return;
    }

    setDraftName(metadata.name);
    setDraftDescription(metadata.description);
    setDraftTags(metadata.tags.join(', '));
    setDraftCategory(metadata.category);
    nameRef.current?.focus();
  }, [open, metadata]);

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

  if (!open || !metadata) {
    return null;
  }

  function handleSave() {
    onSave(
      normalizeCircuitMetadata({
        name: draftName,
        description: draftDescription,
        tags: draftTags.split(','),
        category: draftCategory,
      }),
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-stretch overflow-y-auto bg-gray-950/65 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close circuit metadata modal"
      />

      <div className="relative z-[101] flex min-h-full w-full flex-col overflow-hidden bg-gray-900 sm:min-h-0 sm:max-w-xl sm:rounded sm:border sm:border-gray-700 sm:shadow-2xl">
        <div className="flex items-center justify-between border-gray-800 border-b bg-gray-950 px-4 py-2">
          <div>
            <h2 className="font-mono text-gray-100 text-sm uppercase tracking-wider">
              Circuit Metadata
            </h2>
            <p className="mt-1 font-sans text-gray-500 text-xs">
              Saved into exported circuit JSON.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-700 bg-gray-900 p-1.5 text-gray-500 transition-colors hover:text-gray-200"
            aria-label="Close circuit metadata modal"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4">
          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
              Name
            </span>
            <input
              ref={nameRef}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="rounded border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-gray-100 text-sm outline-none transition-colors focus:border-blue-500"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
              Category
            </span>
            <div className="relative">
              <select
                value={draftCategory}
                onChange={(event) =>
                  setDraftCategory(event.target.value as ExampleCategory)
                }
                className="w-full appearance-none rounded border border-gray-700 bg-gray-950 px-3 py-2 pr-10 font-mono text-gray-100 text-sm outline-none transition-colors focus:border-blue-500"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
              />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
              Tags
            </span>
            <input
              value={draftTags}
              onChange={(event) => setDraftTags(event.target.value)}
              className="rounded border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-gray-100 text-sm outline-none transition-colors focus:border-blue-500"
            />
            <span className="font-sans text-gray-500 text-xs">
              Comma-separated. Example: fuzz, transistor, vintage
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
              Description
            </span>
            <textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              rows={5}
              className="min-h-28 rounded border border-gray-700 bg-gray-950 px-3 py-2 font-sans text-gray-100 text-sm leading-6 outline-none transition-colors focus:border-blue-500"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-gray-800 border-t bg-gray-950 px-4 py-3">
          <Button onClick={onClose} variant="ghost" tone="muted">
            Cancel
          </Button>
          <Button onClick={handleSave} tone="blue">
            Save Metadata
          </Button>
        </div>
      </div>
    </div>
  );
}
