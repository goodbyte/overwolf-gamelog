define([
  'constants/constants',
  'utils/promisify',
  'vendor/socket.io',
],
function(constants, promisify, io) {

  const URL = constants.URL;
  let socket;

  function connect() {
    return new Promise((resolve, reject) => {
      if (socket) return reject('Socket has already been created');

      const token = localStorage.token;
      socket = io.connect(`${URL}/?token=${token}`);
      socket.on('connect', () => {
        console.log('Socket connected');

        promisify(overwolf.utils.getSystemInformation)
          .then((response) => {
            emit('hardware', response.systemInfo);
          });

        resolve();
      });
      socket.on('disconnect', () => console.error('Socket disconnected'));
      socket.on('error', (err) => {
        socket = null;
        reject(err);
      });
    });
  }

  function disconnect() {
    socket && socket.disconnect();
    socket = null;
  }

  function emit(type, data) {
    if (!socket || socket.disconnected) return;
    socket.emit(type, data);
  }

  return {
    connect,
    disconnect,
    emit,
  };

});