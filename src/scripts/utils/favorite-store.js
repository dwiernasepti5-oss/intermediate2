import {
  addFavorite as addFavoriteToDb,
  deleteFavorite as deleteFavoriteFromDb,
  getFavorites as readFavoritesFromDb,
  isFavorite as isFavoriteInDb,
} from './idb';
import { showNotification } from './index.js';

class FavoriteStore {
  constructor() {
    this._listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  async notify() {
    const favorites = await readFavoritesFromDb();
    this._listeners.forEach((listener) => {
      try {
        listener(favorites);
      } catch (error) {
        console.error('Favorite listener error:', error);
      }
    });
  }
}

const favoriteStore = new FavoriteStore();

export async function getFavoriteStories() {
  return readFavoritesFromDb();
}

export async function isStoryFavorite(id) {
  return isFavoriteInDb(id);
}

export async function addStoryToFavorite(story) {
  await addFavoriteToDb(story);
  await favoriteStore.notify();
  showNotification('Story berhasil ditambahkan ke favorit', 'success');
}

export async function removeStoryFromFavorite(id) {
  await deleteFavoriteFromDb(id);
  await favoriteStore.notify();
  showNotification('Story berhasil dihapus dari favorit', 'remove');
}

export { favoriteStore };
