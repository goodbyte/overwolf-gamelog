define([
  'services/highlights',
  '@firebase/app',
  '@firebase/auth',
  '@firebase/storage',
],
function(highlights, firebase) {

  const config = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: ""
  };

  firebase.initializeApp(config);

  async function signIn() {
    const token = localStorage.firebaseToken;
    await firebase.auth().signInWithCustomToken(token);
  }

  class UploadTask {
    constructor(url) {
      this.url = url;
      this.progress = 0;
      this.state = null;
    }

    upload() {
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;

        this.getFile()
          .then((file) => {
            const url = this.url;
            const name = url.substring(url.lastIndexOf('/') + 1);
            const ref = firebase.storage().ref(name);

            this.task = ref.put(file, {contentType: 'video/mp4'}),
            this.task.on('state_changed',
              this.onProgress.bind(this),
              this.onError.bind(this),
              this.onComplete.bind(this),
            );
          })
          .catch(this.onError.bind(this));
      });
    }

    getFile() {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', this.url, true);
        request.responseType = 'blob';

        request.onload = () => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            resolve(reader.result);
          }
          reader.readAsArrayBuffer(request.response);
        };

        request.onerror = reject;
        request.send();
      });
    }

    onProgress(snapshot) {
      this.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      this.state = snapshot.state;
    }

    onError(err) {
      if (err.code !== 'storage/canceled') {
        alert(`Could not upload file. ${err.message}`);
        console.error(err);
      }
      this.reject(err);
    }

    onComplete() {
      this.task.snapshot.ref.getDownloadURL()
        .then(this.resolve);
    }

    pause() {
      this.task.pause();
    }

    resume() {
      this.task.resume();
    }

    cancel() {
      this.task.cancel();
    }
  }

  return {
    signIn,
    UploadTask,
  };

});