const DATABASE_NAME = "papre-local";
const DATABASE_VERSION = 1;
const DRAFT_STORE = "page-drafts";

export type OfflineDraft = {
  key: string;
  content: string;
  updatedAt: number;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function draftKey(userId: string, nodeId: string) {
  return `${userId}:${nodeId}`;
}

export async function getOfflineDraft(userId: string, nodeId: string) {
  const database = await openDatabase();

  return new Promise<OfflineDraft | undefined>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, "readonly");
    const request = transaction.objectStore(DRAFT_STORE).get(draftKey(userId, nodeId));

    request.onsuccess = () => resolve(request.result as OfflineDraft | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveOfflineDraft(
  userId: string,
  nodeId: string,
  content: string,
) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, "readwrite");
    transaction.objectStore(DRAFT_STORE).put({
      key: draftKey(userId, nodeId),
      content,
      updatedAt: Date.now(),
    } satisfies OfflineDraft);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteOfflineDraftIfContentMatches(
  userId: string,
  nodeId: string,
  content: string,
) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, "readwrite");
    const store = transaction.objectStore(DRAFT_STORE);
    const request = store.get(draftKey(userId, nodeId));

    request.onsuccess = () => {
      const draft = request.result as OfflineDraft | undefined;
      if (draft?.content === content) {
        store.delete(draft.key);
      }
    };
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
