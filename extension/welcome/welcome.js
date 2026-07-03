document.getElementById('testBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'testPostureNotification' });
  document.getElementById('testSent').hidden = false;
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
