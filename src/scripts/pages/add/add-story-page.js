import Api from '../../data/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addToQueue, getQueue, saveStoryLocal, deleteQueueItem } from '../../utils/idb';

async function showStoryNotification(bodyText) {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;
  const base = import.meta.env.BASE_URL || '/';

  await registration.showNotification('MStory', {
    body: bodyText,
    icon: `${base}images/icon-192.png`,
    badge: `${base}images/icon-192.png`,
    tag: 'story-update',
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function base64ToBlob(base64) {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

const AddStoryPage = {
  async render() {
    const section = document.createElement('section');
    section.innerHTML = `
      <h1 class="sr-only">Halaman Tambah Story</h1>
      <h2 class="page-title">Tambah Story</h2>
      <form id="storyForm">
        <label for="description">Deskripsi</label>
        <textarea id="description" required></textarea>
        <label for="photo">Foto</label>
        <input type="file" id="photo" accept="image/*" required>
        <div id="mapAdd" class="map-add" aria-label="Peta untuk memilih lokasi"></div>
        <button type="submit">Kirim</button>
        <p id="message" role="status" aria-live="polite"></p>
      </form>`;
    return section;
  },

  async afterRender() {
    const map = L.map('mapAdd', { attributionControl: false }).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    setTimeout(() => {
      try { map.invalidateSize(); } catch (e) { }
    }, 300);

    let markerLayer = null;
    let lat = null, lon = null;
    map.on('click', (e) => {
      lat = e.latlng.lat;
      lon = e.latlng.lng;

      if (markerLayer) {
        map.removeLayer(markerLayer);
        markerLayer = null;
      }

      markerLayer = L.circleMarker([lat, lon], {
        radius: 8,
        color: '#e86e9b',
        weight: 2,
        fillColor: '#f58fb5',
        fillOpacity: 0.95,
        pane: 'overlayPane',
      }).addTo(map);

      markerLayer.bindPopup('Lokasi story dipilih').openPopup();
    });

    const form = document.getElementById('storyForm');
    const msg = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const desc = form.description.value.trim();
      const photo = form.photo.files[0];

      if (!desc || !photo || lat === null || lon === null) {
        msg.textContent = 'Isi semua kolom & klik lokasi di peta!';
        msg.style.color = 'red';
        return;
      }
      if (!navigator.onLine) {
        const base64 = await fileToBase64(photo);
        await addToQueue({
          type: 'add-story',
          payload: { description: desc, photoBase64: base64, lat, lon },
        });
        await saveStoryLocal({ description: desc, photoUrl: base64, lat, lon });
        msg.textContent = 'Offline: story disimpan & akan dikirim saat online.';
        msg.style.color = 'orange';
        await showStoryNotification('Story disimpan offline & siap dikirim.');
        form.reset();
        if (markerLayer) { map.removeLayer(markerLayer); markerLayer = null; lat = null; lon = null; }
        return;
      }

      try {
        await Api.addStory({ description: desc, photo, lat, lon });
        msg.textContent = 'Story berhasil dikirim!';
        msg.style.color = 'green';
        await showStoryNotification('Story baru berhasil kamu bagikan!');
        form.reset();
        if (markerLayer) { map.removeLayer(markerLayer); markerLayer = null; lat = null; lon = null; }
      } catch (err) {
        console.error('Add story error:', err);
        msg.textContent = 'Gagal kirim story.';
        msg.style.color = 'red';
      }
    });

    window.addEventListener('online', async () => {
      const queue = await getQueue();
      for (const q of queue) {
        if (q.type === 'add-story') {
          try {
            const blob = base64ToBlob(q.payload.photoBase64);
            await Api.addStory({
              description: q.payload.description,
              photo: blob,
              lat: q.payload.lat,
              lon: q.payload.lon,
            });
            await deleteQueueItem(q.qid);
            await showStoryNotification('Story offline berhasil tersinkron!');
          } catch (err) {
            console.error('Sync failed for item', q, err);
          }
        }
      }
      msg.textContent = 'Sinkronisasi offline berhasil!';
      msg.style.color = 'green';
    });
  },
};

export default AddStoryPage;
