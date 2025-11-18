const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1).toLowerCase() || '/';
    const segments = url.split('/');
    return (segments[1] ? `/${segments[1]}` : '/');
  },
};

export default UrlParser;
