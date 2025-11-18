import { openDB } from 'idb';

const DB_NAME = 'mstory-db';
const DB_VERSION = 1;

const STORE_STORY = 'stories';
const STORE_QUEUE = 'sync-queue';
const STORE_FAVORITE = 'favorites';

function ensureKeyPathValue(item, fallbackPrefix = 'local') {
  if (!item || typeof item !== 'object') return item;
  if (item.id) return item;
  const uniqueId =
    item.localId ||
    `${fallbackPrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return { ...item, id: uniqueId };
}

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_STORY)) {
      db.createObjectStore(STORE_STORY, { keyPath: 'id', autoIncrement: true });
    }

    if (!db.objectStoreNames.contains(STORE_QUEUE)) {
      db.createObjectStore(STORE_QUEUE, { keyPath: 'qid', autoIncrement: true });
    }

    if (!db.objectStoreNames.contains(STORE_FAVORITE)) {
      db.createObjectStore(STORE_FAVORITE, { keyPath: 'id' }); 
    }
  },
});

export async function saveStoryLocal(story) {
  const db = await dbPromise;
  const storyWithId = ensureKeyPathValue(story, 'story');
  await db.put(STORE_STORY, storyWithId);
  return storyWithId;
}

export async function getAllStories() {
  const db = await dbPromise;
  return db.getAll(STORE_STORY);
}

export async function addFavorite(story) {
  const db = await dbPromise;
  const storyWithId = ensureKeyPathValue(story, 'favorite');
  await db.put(STORE_FAVORITE, storyWithId);
}

export async function deleteFavorite(id) {
  const db = await dbPromise;
  return db.delete(STORE_FAVORITE, id);
}

export async function getFavorites() {
  const db = await dbPromise;
  return db.getAll(STORE_FAVORITE);
}

export async function isFavorite(id) {
  const db = await dbPromise;
  const data = await db.get(STORE_FAVORITE, id);
  return !!data;
}

export async function addToQueue(item) {
  const db = await dbPromise;
  await db.put(STORE_QUEUE, item);
}

export async function getQueue() {
  const db = await dbPromise;
  return db.getAll(STORE_QUEUE);
}

export async function deleteQueueItem(qid) {
  const db = await dbPromise;
  await db.delete(STORE_QUEUE, qid);
}
