import {
  favoriteStore,
  getFavoriteStories,
  removeStoryFromFavorite,
} from '../../utils/favorite-store';
import { showFormattedDate } from '../../utils/index.js';

const FavoritePage = {
  async render() {
    const section = document.createElement('section');
    section.classList.add('home-section');
    section.innerHTML = `
      <h1 class="sr-only">Halaman Story Favorit</h1>
      <h2 class="page-title">Story Favorit</h2>
      <p id="favoriteEmpty" class="story-title" style="display:none;">Belum ada story favorit.</p>
      <ul id="favoriteList" class="story-list" aria-live="polite"></ul>
    `;
    return section;
  },

  async afterRender() {
    this._favoriteListEl = document.getElementById('favoriteList');
    this._emptyStateEl = document.getElementById('favoriteEmpty');

    const renderFavorites = (stories = []) => {
      if (!this._favoriteListEl) return;
      this._favoriteListEl.innerHTML = '';

      if (!stories.length) {
        if (this._emptyStateEl) this._emptyStateEl.style.display = 'block';
        return;
      }

      if (this._emptyStateEl) this._emptyStateEl.style.display = 'none';

      stories.forEach((story) => {
        const li = document.createElement('li');
        li.classList.add('story-card');

        li.innerHTML = `
          <img src="${story.photoUrl}" alt="Foto ${story.name || 'Story'}">
          <button class="fav-btn" data-id="${story.id}" aria-label="Hapus dari favorit">❤️</button>
          <div class="story-info">
            <h4>${story.name || 'Tanpa Judul'}</h4>
            <p class="story-date">${showFormattedDate(story.createdAt || Date.now(), 'id-ID')}</p>
            <p>${story.description || ''}</p>
          </div>
        `;

        this._favoriteListEl.appendChild(li);
      });
    };

    renderFavorites(await getFavoriteStories());

    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = favoriteStore.subscribe(renderFavorites);

    this._favoriteListEl.addEventListener('click', async (event) => {
      if (!event.target.classList.contains('fav-btn')) return;
      event.stopPropagation();

      const id = event.target.dataset.id;
      await removeStoryFromFavorite(id);
    });
  },

  cleanup() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  },
};

export default FavoritePage;
