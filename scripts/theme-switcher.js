// Theme Switcher
// Handles light/dark mode toggle with localStorage persistence

(function() {
  'use strict';

  // Get theme from localStorage or default to dark
  const getTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  };

  // Set theme
  const setTheme = (theme) => {
    const lightModeLink = document.getElementById('light-mode-css');
    
    if (theme === 'light') {
      // Create and add light mode stylesheet if it doesn't exist
      if (!lightModeLink) {
        const link = document.createElement('link');
        link.id = 'light-mode-css';
        link.rel = 'stylesheet';
        link.href = './styles/light-mode.css';
        document.head.appendChild(link);
      }
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    } else {
      // Remove light mode stylesheet
      if (lightModeLink) {
        lightModeLink.remove();
      }
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    }
    
    localStorage.setItem('theme', theme);
    updateThemeButton(theme);
  };

  // Update theme button text/icon
  const updateThemeButton = (theme) => {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    if (theme === 'light') {
      themeBtn.innerHTML = '🌙';
      themeBtn.setAttribute('aria-label', 'Switch to dark mode');
      themeBtn.setAttribute('title', 'Dark mode');
    } else {
      themeBtn.innerHTML = '☀️';
      themeBtn.setAttribute('aria-label', 'Switch to light mode');
      themeBtn.setAttribute('title', 'Light mode');
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Initialize theme on page load
  const initTheme = () => {
    const theme = getTheme();
    setTheme(theme);

    // Add event listener to theme toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Expose toggleTheme globally if needed
  window.toggleTheme = toggleTheme;
})();
