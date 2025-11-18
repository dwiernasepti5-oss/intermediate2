import UrlParser from '../routes/url-parser.js';
import routes from '../routes/routes.js';

export default class App {
  constructor({ content }) {
    this._content = content;
  }

  async renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url];
    if (!page) {
      this._content.innerHTML = `
        <section class="home-section">
          <h2 class="page-title">Halaman tidak ditemukan</h2>
          <p>Rute yang Anda buka belum tersedia.</p>
        </section>
      `;
      return;
    }

    this._content.innerHTML = '<p>Loading...</p>';
    const result = await page.render();
    this._content.innerHTML = '';
    this._content.appendChild(result);
    if (page.afterRender) page.afterRender();
  }
}
