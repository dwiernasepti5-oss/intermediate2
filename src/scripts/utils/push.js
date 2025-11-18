import Api from '../data/api';
import { CONFIG } from '../config.js';

const PUBLIC_VAPID_KEY = CONFIG.VAPID_PUBLIC_KEY;

export async function askNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;

  const registration = await navigator.serviceWorker.ready;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export async function setupPush() {
  const permission = await askNotificationPermission();
  if (permission !== 'granted') return;

  const subscription = await subscribeUserToPush();
  if (!subscription) return;

  try {
    console.debug('Subscription raw object:', subscription);
    if (typeof subscription.toJSON === 'function') console.debug('Subscription JSON:', subscription.toJSON());
    if (subscription.getKey) {
      try {
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');
        console.debug('Subscription keys (raw):', p256dh, auth);
      } catch (e) {
      }
    }
  } catch (e) {
  }

  const res = await Api.subscribeNotification(subscription);
  if (!res || !res.ok) {
    console.warn('Failed to register subscription on server:', res);
    const msg = res?.body?.message || 'Pendaftaran subscription gagal pada server.';
    alert(`Pendaftaran notifikasi gagal: ${msg}`);
    return;
  }
  alert('Notifikasi diaktifkan');
}
