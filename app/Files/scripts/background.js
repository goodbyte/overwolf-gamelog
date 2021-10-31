require([
  'utils/windows',
  'services/game-events',
],
function(windows, gameEvents) {

  const launchSource = new URLSearchParams(location.search).get('source');

  if (launchSource !== 'gamelaunchevent') {
    windows.main.restore();
  }

  windows.notification.restore();

  overwolf.windows.onStateChanged.addListener((result) => {
    if (result && result.window_name === 'main' && result.window_state === 'closed') {
      windows.gallery.close();
    }
  });

  overwolf.extensions.onAppLaunchTriggered.addListener((result) => {
    if (result.origin === 'gamelaunchevent') return;
    windows.main.restore();
  });

});