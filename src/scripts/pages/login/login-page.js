import Api from '../../data/api';

const LoginPage = {
  async render() {
    const section = document.createElement('section');
    section.innerHTML = `
      <h1 class="sr-only">Login ke MStory</h1>
      <h2>Login</h2>
      <form id="loginForm">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>

          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>

          <button type="submit">Masuk</button>
          <p id="loginMessage"></p>
      </form>

    `;
    return section;
  },

  async afterRender() {
    const form = document.getElementById('loginForm');
    const msg = document.getElementById('loginMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const loginBtn = form.querySelector('button[type="submit"]');
      const email = form.email.value;
      const password = form.password.value;

      loginBtn.disabled = true;
      const originalText = loginBtn.textContent;
      loginBtn.textContent = 'Memproses...';

      try {
        const res = await Api.login({ email, password });
        msg.textContent = res.message;
        if (!res.error) {
        location.hash = '/';
        }
    } catch (err) {
      msg.textContent = 'Terjadi kesalahan jaringan.';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
    }
  });

  },
};

export default LoginPage;
