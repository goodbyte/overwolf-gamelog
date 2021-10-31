define([
  'utils/promisify',
  'vendor/lockr'
],
function(promisify, lockr) {

  const keyName = 'highlights';

  function getInstance() {
    const highlights = lockr.get(keyName);
    return Array.isArray(highlights) ? highlights : [];
  }

  function set(highlights) {
    for (highlight of highlights) {
      delete highlight.upload;
    }
    lockr.set(keyName, highlights);
  }

  function get() {
    return promisify(overwolf.media.videos.getVideos)
      .then((result) => {
        const replays = result.videos.map((video) => video.replace('videos', 'replays'));
        const highlights = getInstance();
        const newHighlights = highlights.filter((highlight) => replays.includes(highlight.url)).sort(sort);
        set(newHighlights);

        return newHighlights;
      });
  }

  function add(obj) {
    const highlights = getInstance();
    highlights.push(obj);
    set(highlights);
  }

  function sort(a, b) {
    if (a.start_time < b.start_time) return 1;
    else if (a.start_time > b.start_time) return -1;
    else return 0;
  }

  return {
    add,
    set,
    get,
  };

});