define([
  'utils/promisify',
  'services/event-bus'
],
function(promisify, eventBus) {

  const settings = {
    settings: {
      video: {
        fps: 60,
        width: 1280,
        height: 720,
        'max_kbps': 3500,
        'buffer_length': 25000,
      },
    },
  };
  const pastDuration = 20000;
  const futureDuration = 5000;

  function turnOn() {
    return promisify(overwolf.media.replays.turnOn, settings)
      .then((result) => {
        if (result.error) return;
        eventBus.trigger('turnOn');
      });
  }

  function turnOff() {
    return promisify(overwolf.media.replays.turnOff)
      .then(() => {
        eventBus.trigger('turnOff');
      });
  }

  function isOn() {
    return promisify(overwolf.media.replays.getState)
      .then((result) => result.isOn);
  }

  function capture() {
    return new Promise((resolve, reject) => {
      promisify(overwolf.media.replays.capture, pastDuration, futureDuration, (result) => {
        if (result.status === 'success') resolve(result);
        else reject(result.error || result.reason || result);
      }).catch(reject);
    });
  }

  return {
    turnOn,
    turnOff,
    isOn,
    capture,
  };

});