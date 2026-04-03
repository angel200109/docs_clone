import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

const LOCAL_SYNC_METADATA_KEY = "sync-metadata";

export interface LocalYjsSyncMetadata {
  hasLocalUnsyncedChanges: boolean;
  lastLocalEditedAt?: number;
  lastRemoteHash?: string;
  lastRemoteUpdatedAt?: number;
  lastRemoteVersion?: number;
}

export function createLocalYjsPersistence(documentId: string, ydoc: Y.Doc) {
  return new IndexeddbPersistence(`doc-${documentId}`, ydoc);
}

export async function waitForLocalYjsPersistence(persistence: IndexeddbPersistence) {
  await persistence.whenSynced;
  return persistence;
}

export async function getLocalYjsSyncMetadata(persistence: IndexeddbPersistence) {
  const metadata = await persistence.get(LOCAL_SYNC_METADATA_KEY);
  if (typeof metadata !== "string") {
    return null;
  }

  return JSON.parse(metadata) as LocalYjsSyncMetadata;
}

export async function setLocalYjsSyncMetadata(
  persistence: IndexeddbPersistence,
  metadata: LocalYjsSyncMetadata
) {
  await persistence.set(LOCAL_SYNC_METADATA_KEY, JSON.stringify(metadata));
  return metadata;
}
