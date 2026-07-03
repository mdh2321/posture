// Theme provider — IIFE that applies theme class to <html> immediately
(function() {
  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
    }
  }

  function applyAccent(accent) {
    const html = document.documentElement;
    html.classList.remove('accent-green', 'accent-amber');
    if (accent === 'green' || accent === 'amber') {
      html.classList.add(`accent-${accent}`);
    }
  }

  // Load theme + accent from storage and apply
  chrome.storage.sync.get('settings', (result) => {
    const settings = result.settings || {};
    applyTheme(settings.theme || 'system');
    applyAccent(settings.accent || 'indigo');
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.settings && changes.settings.newValue) {
      applyTheme(changes.settings.newValue.theme || 'system');
      applyAccent(changes.settings.newValue.accent || 'indigo');
    }
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    chrome.storage.sync.get('settings', (result) => {
      const theme = (result.settings && result.settings.theme) || 'system';
      if (theme === 'system') {
        applyTheme('system');
      }
    });
  });
})();
