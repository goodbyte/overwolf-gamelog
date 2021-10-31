define(function() {
  return function promisify(func, ...params) {
    return new Promise((resolve, reject) => {
      const bindFunc = func.bind(overwolf, ...params);
      bindFunc((response) => {
        if (response.status === 'success') resolve(response);
        else reject(response.error || response.reason || response);
      });
    });
  };
});