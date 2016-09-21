import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import csv from 'niarc-map-editor/utils/csv';
import Line from 'niarc-map-editor/objects/line';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  on,
  computed,
  observer,
  RSVP,
  run
} = Ember;

export default Ember.Service.extend({
  address: '192.168.1.5:4000',
  events: [],
  robotData: null,

  openDbConnection: on('init', function() {
    const openReq = indexedDB.open('niarc', 1);

    openReq.onerror = console.error;
    openReq.onupgradeneeded = this.setupDb.bind(this);
    openReq.onsuccess = this.onDbOpen.bind(this);
  }),

  setupDb(event) {
    const db = event.target.result;
    const instructionsStore = db.createObjectStore('instructions', { keyPath: 'id', autoIncrement: true });
    
    if (localStorage.events) {
      instructionsStore.add({
        name: 'Instructions From LocalStorage',
        events: localStorage.events,
        modified: Date.now()
      });
    }
  },

  onDbOpen(event) {
    const db = event.target.result;

    db.onerror = console.error;

    set(this, 'db', db);
  },

  getDb() {
    const db = get(this, 'db');

    if (db) {
      return RSVP.resolve(db);
    }

    return new RSVP.Promise(resolve => {
      run.later(() => resolve(this.getDb()), 500);
    });
  },

  find(storeName, id) {
    return this.getDb().then(db => {
      const transaction = db.transaction([ storeName ], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      return new RSVP.Promise((resolve, reject) => {
        request.onerror = reject;
        request.onsuccess = event => resolve(request.result);
      });
    });
  },

  findAll(storeName) {
    return this.getDb().then(db => {
      const transaction = db.transaction([ storeName ], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      return new RSVP.Promise((resolve, reject) => {
        request.onerror = reject;
        request.onsuccess = event => resolve(request.result);
      });
    });
  },

  create(storeName, data) {
    return this.getDb().then(db => {
      const transaction = db.transaction([ storeName ], 'readwrite');
      const store = transaction.objectStore(storeName);

      return new RSVP.Promise((resolve, reject) => {
        const request = store.add(data);
        
        request.onerror = reject;
        request.oncomplete = resolve;
      });
    });
  },

  update(storeName, data) {
    return this.getDb().then(db => {
      const transaction = db.transaction([ storeName ], 'readwrite');
      const store = transaction.objectStore(storeName);

      return new RSVP.Promise((resolve, reject) => {
        const request = store.put(data);
        
        request.onerror = reject;
        request.oncomplete = resolve;
      });
    });
  },

  persistAddress: observer('address', function() {
    localStorage.address = get(this, 'address');
  }),

  map: computed(function() {
    const table = csv.parse(localStorage.map || '');
    const walls = table.map(row => Line.create().deserialize(row));

    return walls;
  }),

  persistMap: observer('map.[]', function() {
    const map = get(this, 'map');

    localStorage.map = map.map(line => line.serialize()).join('\n');
  })
});
