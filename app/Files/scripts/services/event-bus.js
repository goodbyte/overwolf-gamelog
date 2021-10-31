define([
  'vendor/event-emitter',
],
function(EventEmitter) {

  const mainWindow = overwolf.windows.getMainWindow();

  if (!mainWindow.ow_eventBus) {
    mainWindow.ow_eventBus = new EventEmitter();
  }

  return mainWindow.ow_eventBus;

});