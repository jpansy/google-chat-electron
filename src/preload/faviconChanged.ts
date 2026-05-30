import {ipcRenderer} from 'electron';

// Google chat initially loads favicon with rel="icon",
// but replace it with rel="shortcut icon" when a new message appears.
// We need to query for both elements
const targetSelectors = [
  'link[rel="shortcut icon"]',
  'link[rel="icon"]'
];

let previousHref: null | string = '';
const emitFaviconChanged = (favicon: HTMLLinkElement) => {
  const href = favicon?.href || '';

  if (previousHref === href) {
    return;
  }

  // Skip transient empty hrefs — Chat occasionally rerenders <head> and the favicon
  // element briefly has no href. Reporting "" would force the tray icon to "offline".
  if (!href) {
    console.log('[favicon] skipping empty href (transient DOM state)');
    return;
  }

  console.log('[favicon] href changed:', previousHref, '->', href);
  previousHref = href;

  ipcRenderer.send('faviconChanged', href);
}

const initObserver = () => {
  let favicons = document.head.querySelectorAll(targetSelectors.join(','));
  emitFaviconChanged(favicons[0] as HTMLLinkElement);
}

let interval: NodeJS.Timeout;
window.addEventListener('DOMContentLoaded', () => {
  clearInterval(interval);
  interval = setInterval(initObserver, 1000)
});
