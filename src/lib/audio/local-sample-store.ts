import type { LocalSample } from '../simulation-types';

type PersistedLocalSample = LocalSample & {
  data: ArrayBuffer;
};

const DB_NAME = 'solder-audio';
const STORE_NAME = 'local-samples';
const DB_VERSION = 1;

/**
 * Open the IndexedDB database that stores user-uploaded WAV samples.
 *
 * We keep audio bytes out of Zustand/localStorage because WAV payloads are too
 * large for the regular persisted store.
 */
function openLocalSampleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error('Failed to open local sample database'),
      );
  });
}

/**
 * Read all persisted sample metadata from IndexedDB.
 *
 * The app uses this on boot to repopulate the sidebar list without eagerly
 * decoding every WAV file into memory.
 */
export async function listLocalSamples(): Promise<Array<LocalSample>> {
  const db = await openLocalSampleDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = (request.result as Array<PersistedLocalSample>).map(
        ({ id, name }) => ({
          id,
          name,
        }),
      );

      resolve(records);
    };

    request.onerror = () =>
      reject(request.error ?? new Error('Failed to read local samples'));

    tx.oncomplete = () => db.close();
    tx.onerror = () =>
      reject(tx.error ?? new Error('Failed to read local samples'));
  });
}

/**
 * Store a user-uploaded WAV file in IndexedDB so it survives page refreshes.
 */
export async function saveLocalSample(
  sample: PersistedLocalSample,
): Promise<void> {
  const db = await openLocalSampleDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(sample);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () =>
      reject(tx.error ?? new Error('Failed to save local sample'));
  });
}

/**
 * Load the raw WAV bytes for one persisted local sample.
 *
 * The audio pipeline decodes this on demand when the selected source is used
 * after a refresh.
 */
export async function getLocalSampleBuffer(
  id: string,
): Promise<ArrayBuffer | null> {
  const db = await openLocalSampleDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result as PersistedLocalSample | undefined;
      resolve(record?.data ?? null);
    };

    request.onerror = () =>
      reject(request.error ?? new Error('Failed to load local sample'));

    tx.oncomplete = () => db.close();
    tx.onerror = () =>
      reject(tx.error ?? new Error('Failed to load local sample'));
  });
}

/**
 * Delete a persisted local sample from IndexedDB.
 */
export async function deleteLocalSample(id: string): Promise<void> {
  const db = await openLocalSampleDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () =>
      reject(tx.error ?? new Error('Failed to delete local sample'));
  });
}
