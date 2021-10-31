define([
  'utils/promisify',
], function(promisify) {

  class OWWindow {
    constructor(name) {
      this.name = name;
      this.ready = this.obtain();
    }

    obtain() {
      return promisify(overwolf.windows.obtainDeclaredWindow, this.name)
        .then((result) => this.window = result.window);
    }

    restore() {
      this.ready = this.obtain();
      return this.ready
        .then(() => promisify(overwolf.windows.restore, this.name));
    }

    dragMove() {
      return this.ready
        .then(() => promisify(overwolf.windows.dragMove, this.name));
    }

    dragResize() {
      return this.ready
        .then(() => overwolf.windows.dragResize(this.name, 'BottomRight'))
    }

    changeSize(width, height) {
      return this.ready
        .then(() => promisify(overwolf.windows.changeSize, this.name, width, height));
    }

    changePosition(left, top) {
      return this.ready
        .then(() => promisify(overwolf.windows.changePosition, this.name, left, top));
    }

    minimize() {
      return this.ready
        .then(() => this.obtain())
        .then(() => {
          if (this.window.isVisible) {
            return promisify(overwolf.windows.minimize, this.name)
          }
        });
    }

    close() {
      this.ready = this.obtain();
      return this.ready
        .then(() => promisify(overwolf.windows.close, this.name));
    }
  }

  class OWWindows {
    constructor() {
      const names = ['background', 'main', 'gallery', 'notification'];
      for (const name of names) {
        this[name] = new OWWindow(name);
      }
    }

    static current() {
      return promisify(overwolf.windows.getCurrentWindow)
        .then((result) => this[result.window.name]);
    }
  }

  return new OWWindows();
});