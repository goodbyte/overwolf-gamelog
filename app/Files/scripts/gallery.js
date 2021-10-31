require.config({
  paths: {
    '@firebase/app': 'vendor/firebase/firebase',
    '@firebase/auth': 'vendor/firebase/firebase-auth',
    '@firebase/storage': 'vendor/firebase/firebase-storage',
  },
});

define('global/window', [], () => {
  return window;
});

define('global/document', ['global/window'], (window) => {
  return window.document;
});

define([
  'utils/promisify',
  'utils/windows',
  'services/event-bus',
  'services/highlights',
  'services/firebase',
  'vendor/vue',
  'vendor/moment',
  'vendor/video-js/video-js',
],
function(promisify, windows, eventBus, highlights, firebase, Vue, moment, videojs) {

  const header = document.getElementById('header');
  const close = document.getElementById('window-close');
  const minimize = document.getElementById('window-minimize');
  const resize = document.getElementById('window-resize');

  header.onmousedown = (event) => windows.gallery.dragMove();
  close.onclick = () => windows.gallery.close();
  minimize.onclick = () => windows.gallery.minimize();
  resize.onmousedown = () => windows.gallery.dragResize();


  Vue.component('v-video', {
    template: `
    <video controls class="video-js vjs-big-play-centered" style="width: 100%" ref="vid" :src="src">
      <source type="video/mp4" :src="src" >
    </video>`,
    props: {
      src: String,
    },
    mounted() {
      videojs(this.$refs.vid, {
        playbackRates: [0.25, 0.5, 1, 1.5, 2],
      });
    },
  });

  new Vue({
    el: '#content',
    data: {
      videos: [],
      selected: null,
      authenticated: false,
      statusMessage: '',
    },
    filters: {
      fromNow(val) {
        return moment(val).fromNow();
      },
    },
    created() {
      firebase.signIn()
        .then(() => {
          this.authenticated = true;
        })
        .catch(() => {
          alert(`Authentication failed miserably. You'll not be able to upload videos :(`);
        });

      highlights.get()
        .then((videos) => {
          this.videos = videos;
          if (videos.length) {
            this.selected = videos[0];
          }
        });
    },
    methods: {
      upload() {
        const url = this.selected.url;
        const uploadTask = new firebase.UploadTask(url);

        this.$set(this.selected, 'upload', uploadTask);

        uploadTask.upload()
          .then((downloadURL) => {
            this.$set(this.selected, 'downloadURL', downloadURL);
          })
          .finally(() => {
            this.selected.upload = null;
            highlights.set(this.videos);
          });
      },
      share() {
        const downloadURL = this.selected.downloadURL;
        if (downloadURL) {
          eventBus.trigger('share', [this.statusMessage, downloadURL]);
          this.statusMessage = '';
        }
      },
    },
  });

});