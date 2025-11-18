import { CONFIG } from '../config.js';

const BASE_URL = CONFIG.BASE_URL;

const Api = {
  async login({ email, password }) {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.error) localStorage.setItem('user', JSON.stringify(data.loginResult));
    return data;
  },

  async register({ name, email, password }) {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  logout() {
    localStorage.removeItem('user');
  },

  getUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  async getStories() {
    const user = this.getUser();
    const res = await fetch(`${BASE_URL}/stories?location=1`, {
      headers: { Authorization: `Bearer ${user?.token || ''}` },
    });
    return res.json();
  },

  async addStory({ description, photo, lat, lon }) {
    const user = this.getUser();
    const token = user?.token || '';
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }
    const res = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },


  async subscribeNotification(subscription) {
    const user = this.getUser();
    const token = user?.token || '';
    const endpoint = `${BASE_URL}/notifications/subscribe`;
    try {
      let subObj = subscription;
      try {
        if (typeof subscription.toJSON === 'function') subObj = subscription.toJSON();
      } catch (e) {
        subObj = subscription;
      }

      const toBase64 = (buffer) => {
        if (!buffer) return null;
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (let i = 0; i < bytes.length; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        return btoa(str);
      };

      let keys = {};
      if (subObj.keys && (subObj.keys.p256dh || subObj.keys.auth)) {
        keys = subObj.keys;
      } else if (subscription.getKey) {
        try {
          const p256dh = subscription.getKey('p256dh');
          const auth = subscription.getKey('auth');
          keys = { p256dh: toBase64(p256dh), auth: toBase64(auth) };
        } catch (e) {
          keys = subObj.keys || {};
        }
      } else {
        keys = subObj.keys || {};
      }

      const body = {
        endpoint: subObj.endpoint,
        keys,
      };

      if (!body.keys || !body.keys.p256dh) {
        return { ok: false, body: { message: 'keys.p256dh is required' } };
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get('content-type') || '';
      let respBody;
      if (contentType.includes('application/json')) respBody = await res.json();
      else respBody = { message: await res.text() };
      return { ok: res.ok, body: respBody };
    } catch (error) {
      console.error('subscribeNotification error', error);
      return { ok: false, body: { message: String(error) } };
    }
  },

  async unsubscribeNotification(endpointUrl) {
    const user = this.getUser();
    const token = user?.token || '';
    const endpoint = `${BASE_URL}/notifications/subscribe`;
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: endpointUrl }),
      });
      const contentType = res.headers.get('content-type') || '';
      let respBody;
      if (contentType.includes('application/json')) respBody = await res.json();
      else respBody = { message: await res.text() };
      return { ok: res.ok, body: respBody };
    } catch (error) {
      console.error('unsubscribeNotification error', error);
      return { ok: false, body: { message: String(error) } };
    }
  },
};

export default Api;
