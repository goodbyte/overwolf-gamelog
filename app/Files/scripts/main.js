define([
  'constants/constants',
  'utils/windows',
  'services/event-bus',
],
function(constants, windows, eventBus) {
  const URL = constants.URL;

  const header = document.getElementById('header');
  const content = document.getElementById('content');
  const close = document.getElementById('window-close');
  const minimize = document.getElementById('window-minimize');
  const resize = document.getElementById('window-resize');
  const iframe = document.getElementById('iframe');

  header.onmousedown = () => windows.main.dragMove();
  close.onclick = () => windows.main.close();
  minimize.onclick = () => windows.main.minimize();
  resize.onmousedown = () => windows.main.dragResize();

  (async () => {
    try {
      await fetch(`${URL}/status`);
      iframe.onload = () => {
        content.classList.remove('loading');
        iframe.classList.remove('hide');
      };
      iframe.src = URL;
    } catch {
      const maintenance = document.getElementById('maintenance');
      content.classList.remove('loading');
      maintenance.classList.remove('hide');
    }
  })();

  window.onmessage = (event) => {
    if (event.origin !== URL) return;

    const {data} = event;

    switch (data.id) {
      case 'token': {
        const {token} = data;
        localStorage.token = token;
      } break;
      case 'gallery': {
        const {token} = data;
        localStorage.firebaseToken = token;
        windows.gallery.restore();
      } break;
    }
  };

  eventBus.on('share', (message, video) => {
    iframe.contentWindow.postMessage({id: 'share', payload: {message, video}}, '*');
  });

});