import Api from '../../data/api';

const RegisterPage = {
  async render() {
    const section = document.createElement('section');
    section.innerHTML = `
      <h1 class="sr-only">Daftar Akun MStory</h1>
      <h2>Register</h2>
      <form id="registerForm">
          <label for="name">Nama</label>
          <input type="text" id="name" name="name" required>

          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>

          <label for="password">Password</label>
          <input type="password" id="password" name="password" minlength="8" required>

          <button type="submit">Daftar</button>
          <p id="message"></p>
      </form>

    `;
    return section;
  },

  async afterRender() {
    const form = document.getElementById('registerForm');
    const message = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const registerBtn = form.querySelector('button[type="submit"]');
      const name = form.name.value;
      const email = form.email.value;
      const password = form.password.value;

      const msg = document.getElementById('message');
      const originalText = registerBtn.textContent;

      registerBtn.disabled = true;
      registerBtn.textContent = 'Memproses...';

    try {
      const res = await Api.register({ name, email, password });
      msg.textContent = res.message;

      if (!res.error) {
        setTimeout(() => {
        location.hash = '/login';
      }, 1000);
    }
  } catch (err) {
    msg.textContent = 'Terjadi kesalahan jaringan. Silakan coba lagi.';
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = originalText;
  }
});
},
};

export default RegisterPage;
