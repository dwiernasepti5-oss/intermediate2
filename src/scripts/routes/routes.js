import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import AddStoryPage from '../pages/add/add-story-page';
import AboutPage from '../pages/about/about-page';
import FavoritePage from '../pages/favorite/favorite-page';

const routes = {
  '/': HomePage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add-story': AddStoryPage,
  '/about': AboutPage,
  '/favorite': FavoritePage,
};

export default routes;
