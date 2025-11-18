import Api from '../../data/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { getAllStories, saveStoryLocal } from '../../utils/idb';
import {
  addStoryToFavorite,
  removeStoryFromFavorite,
  isStoryFavorite,
} from '../../utils/favorite-store';

import { showFormattedDate } from '../../utils/index.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const HomePage = {
  async render() {
    const section = document.createElement('section');
    section.classList.add('home-section');

    section.innerHTML = `
      <h1 class="sr-only">Halaman Beranda MStory</h1>
      <h2 class="page-title">Story Map</h2>

      <div class="map-card">
        <div id="map" class="map-inner"></div>
      </div>

      <h3 class="story-title">Story Update</h3>

      <ul id="storyList" class="story-list"></ul>
    `;
    return section;
  },

  async afterRender() {
    const map = L.map('map').setView([0, 0], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 300);

    const listContainer = document.getElementById('storyList');

    let stories;
    try {
      const res = await Api.getStories();
      stories = res.listStory || [];

      stories.forEach((s) => saveStoryLocal(s));

    } catch {
      stories = await getAllStories();
    }

    const markers = [];

    for (const s of stories) {

      if (s.lat && s.lon) {
        const marker = L.marker([s.lat, s.lon]).addTo(map);
        marker.bindPopup(`
          <strong>${s.name}</strong><br>
          ${s.description}<br>
          <em>${showFormattedDate(s.createdAt)}</em>
        `);
        markers.push(marker);
      }
      const fav = await isStoryFavorite(s.id);

      const li = document.createElement('li');
      li.classList.add('story-card');

      li.innerHTML = `
        <img src="${s.photoUrl}" alt="Foto ${s.name}">
        
        <button class="fav-btn" data-id="${s.id}" aria-pressed="${fav}" aria-label="${fav ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}">
          ${fav ? '❤️' : '🤍'}
        </button>

        <div class="story-info">
          <h4>${s.name}</h4>
          <p class="story-date">${showFormattedDate(s.createdAt)}</p>
          <p>${s.description}</p>
        </div>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.classList.contains("fav-btn")) return; 

        if (s.lat && s.lon) {
          map.setView([s.lat, s.lon], 8);
        }
      });

      listContainer.appendChild(li);
    }

    if (markers.length) {
      map.fitBounds(L.featureGroup(markers).getBounds());
    }

    listContainer.addEventListener('click', async (event) => {
      const btn = event.target.closest('.fav-btn');
      if (!btn) return;

      const id = btn.dataset.id;
      const story = stories.find((s) => s.id === id);
      if (!story) return;

      const currentlyFavorite = await isStoryFavorite(id);

      if (currentlyFavorite) {
        await removeStoryFromFavorite(id);
        btn.textContent = '🤍';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Tambahkan ke favorit');
      } else {
        await addStoryToFavorite(story);
        btn.textContent = '❤️';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Hapus dari favorit');
      }
    });
  },
};

export default HomePage;
