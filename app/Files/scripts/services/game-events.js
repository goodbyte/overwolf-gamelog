define([
  'utils/promisify',
  'utils/windows',
  'services/socket',
  'services/replays',
  'services/highlights',
  'services/event-bus',
  'vendor/lodash',
],
function(promisify, windows, socket, replays, highlights, eventBus, _) {

  let featuresSet = false;
  let gameInfo;
  let pollingHnd;
  let pollingInterval = 5000;

  const games = {
    10906: { // PUBG
      features: ['kill', 'death', 'match'],
      capture: ['kill', 'death'],
      gameStart: 'matchStart',
      gameEnd: 'matchEnd',
      omits: [
        {
          path: 'match_info',
          reg: /roster_\d/,
        }
      ],
    },
  };

  if (localStorage.token) {
    socket.connect();
  }

  isGameAlreadyRunning();

  function isGameAlreadyRunning() {
    overwolf.games.getRunningGameInfo((info) => {
      if (info) {
        gameInfo = info;
        sendGameInfo();
        setFeatures();
        replays.turnOn();
      }
    });
  }

  function sendGameInfo(info) {
    let result = {};

    if (gameInfo) {
      result = _.pick(gameInfo, ['id', 'displayName', 'shortTitle', 'title']);
      if (info) {
        result.info = omitData(info);
      }
    }

    socket.emit('currentGame', result);
  }

  function omitData(info) {
    const id = gameId();
    const game = games[id];
    const result = {...info};

    if (!game || !game.omits) return result;

    for (const omit of game.omits) {
      const obj = _.get(result, omit.path);
      if (!obj) continue;

      _.keys(obj)
        .filter((key) => omit.reg.test(key))
        .forEach((key) => _.unset(result, `${omit.path}.${key}`));
    }

    return result;
  }

  function setFeatures() {
    if (featuresSet) {
      return console.warn('Features are already set');
    }

    const id = gameId();
    const game = games[id];
    if (!game || !game.features) {
      return console.log('No features for game');
    }

    promisify(overwolf.games.events.setRequiredFeatures, game.features)
      .then(() => {
        featuresSet = true;
        console.log('Required features set');
        startPolling();
      })
      .catch(() => {
        console.warn('Could not set required features, trying again in 5 seconds');
        setTimeout(setFeatures, 5000);
      });
  }

  function gameId() {
    return gameInfo.id.toString().slice(0, -1);
  }

  function startPolling() {
    pollingHnd = setInterval(polling, pollingInterval);
  }

  function polling() {
    promisify(overwolf.games.events.getInfo)
      .then((response) => sendGameInfo(response.res))
      .catch(() => sendGameInfo());
  }

  function stopPolling() {
    clearInterval(pollingHnd);
  }

  overwolf.games.onGameInfoUpdated.addListener((update) => {
    gameInfo = update.gameInfo;

    if (update.gameChanged) {
      setFeatures();
      sendGameInfo();
    }

    if (update.runningChanged) {
      windows.background.close();
    }

    if (!update.gameInfo.isInFocus) {
      windows.main.minimize();
      windows.gallery.minimize();
    }
  });

  overwolf.games.events.onNewEvents.addListener((result) => {
    const id = gameId();
    const game = games[id];

    if (!game) return;

    for (const event of result.events) {
      if (game.capture.includes(event.name)) {
        replays.capture()
          .then((result) => {
            highlights.add({...result, eventName: event.name});
          });
      }

      if (game.gameStart === event.name) {
        replays.turnOn();
      }

      if (game.gameEnd === event.name) {
        setTimeout(() => replays.turnOff(), 6000);
      }
    }
  });

  overwolf.settings.registerHotKey('gamelog_turnoff', () => replays.turnOff());

  window.onstorage = (event) => {
    if (event.key !== 'token') return;

    if (event.newValue) socket.connect();
    else socket.disconnect();
  };

});
