document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }

  const sidebarToggle = document.getElementById('sidebarCollapse');
  const sidebar = document.querySelector('.idocs-navigation');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  const backToTop = document.getElementById('back-to-top');
  const toggleBackToTop = () => {
    if (!backToTop) return;
    backToTop.style.display = window.scrollY > 200 ? 'flex' : 'none';
  };
  window.addEventListener('scroll', toggleBackToTop);
  toggleBackToTop();

  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (window.hljs) {
    window.hljs.highlightAll();
  }
});
