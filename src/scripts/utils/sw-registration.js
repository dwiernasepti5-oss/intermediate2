import { CONFIG } from '../config.js';
import Api from '../data/api.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorkerAndSetupPush() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const base = import.meta.env.BASE_URL || '/';
    const swPath = `${base}sw.js`;

    const reg = await navigator.serviceWorker.register(swPath);
    console.log('Service Worker registered:', reg);
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        window.location.href = event.data.url;
      }
    });

    const toggle = document.getElementById('pushToggle');
    if (!toggle) return;

    toggle.checked = localStorage.getItem('pushEnabled') === 'true';

    toggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const currentPermission = Notification.permission;

        if (currentPermission === 'granted') {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
          });
          try {
            console.debug('SW-registration subscription raw:', sub);
            if (typeof sub.toJSON === 'function') console.debug('SW-registration subscription JSON:', sub.toJSON());
          } catch (e) {}
          const resp = await Api.subscribeNotification(sub);
          if (!resp || !resp.ok) {
            const msg = resp?.body?.message || 'Pendaftaran notifikasi gagal pada server.';
            alert(`Pendaftaran notifikasi gagal: ${msg}`);
            toggle.checked = false;
            localStorage.setItem('pushEnabled', 'false');
            return;
          }
          localStorage.setItem('pushEnabled', 'true');
          alert('Notifikasi diaktifkan');
          return;
        }

        if (currentPermission === 'denied') {
          alert('Izin notifikasi sebelumnya ditolak. Silakan ubah izin di pengaturan browser.');
          toggle.checked = false;
          localStorage.setItem('pushEnabled', 'false');
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
          });
            try {
              console.debug('SW-registration subscription raw:', sub);
              if (typeof sub.toJSON === 'function') console.debug('SW-registration subscription JSON:', sub.toJSON());
            } catch (e) {}
            const resp = await Api.subscribeNotification(sub);
          if (!resp || !resp.ok) {
            const msg = resp?.body?.message || 'Pendaftaran notifikasi gagal pada server.';
            alert(`Pendaftaran notifikasi gagal: ${msg}`);
            toggle.checked = false;
            localStorage.setItem('pushEnabled', 'false');
            return;
          }
          localStorage.setItem('pushEnabled', 'true');
          alert('Notifikasi diaktifkan');
        } else {
          alert('Izin notifikasi ditolak');
          toggle.checked = false;
          localStorage.setItem('pushEnabled', 'false');
        }

      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          try {
            await Api.unsubscribeNotification(sub.endpoint);
          } catch (e) {
            console.warn('Failed to notify server about unsubscribe', e);
          }
          await sub.unsubscribe();
        }
        localStorage.setItem('pushEnabled', 'false');
        alert('🔕 Notifikasi dimatikan');
      }
    });

  } catch (err) {
    console.error('SW registration failed:', err);
  }
}
