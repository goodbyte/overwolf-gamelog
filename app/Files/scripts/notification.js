require.config({
  paths: {
    vue: 'vendor/vue',
  },
});

define([
  'utils/promisify',
  'utils/windows',
  'services/replays',
  'services/event-bus',
  'vue',
  'vendor/vue-notifications',
],
function(promisify, windows, replays, eventBus, Vue, VueNotifications) {

  Vue.use(VueNotifications.default);

  new Vue({
    el: '#vue',
    data: {
      hotkey: null,
    },
    created() {
      promisify(overwolf.settings.getHotKey, 'gamelog_turnoff')
        .then((result) => {
          this.hotkey = result.hotkey.split('+');
        });
    },
    mounted() {
      eventBus.on('turnOn', () => {
        this.$notify({
          group: 'capture',
          title: 'Highlights capture is ON!',
          duration: -1,
        });
      });

      eventBus.on('turnOff', () => {
        this.$notify({
          group: 'capture',
          clean: true,
        });
      });
    },
  });

  async function setWindow(info) {
    // const gameInfo = (info && info.gameInfo) || await getGameInfo()
    // const width = (gameInfo && gameInfo.width) || screen.width;

    windows.notification.changeSize(400, 500);
    windows.notification.changePosition(10, 10);
  }

  // function getGameInfo() {
  //   return new Promise((resolve) => {
  //     overwolf.games.getRunningGameInfo((gameInfo) => {
  //       resolve(gameInfo);
  //     });
  //   });
  // }

  windows.notification.ready
    .then((window) => {
      overwolf.streaming.setWindowStreamingMode(window.id, 'Never', () => {});
    });

  overwolf.games.onGameInfoUpdated.addListener(setWindow);

  setWindow();

});