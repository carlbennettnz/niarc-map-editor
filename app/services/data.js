import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import csv from 'niarc-map-editor/utils/csv';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  on,
  computed,
  observer
} = Ember;

export default Ember.Service.extend({
  address: '192.168.1.5:4000',
  events: [],
  robotData: null,

  setPrefix: on('init', function(key, value) {
    set(this, 'prefix', config.environment === 'test' ? 'test-' : '');
  }),

  persistAddress: observer('address', function() {
    const prefix = get(this, 'prefix');

    localStorage[prefix + address] = get(this, 'address');
  }),

  map: computed(function() {
    const prefix = get(this, 'prefix');

    return JSON.parse(localStorage[prefix + 'map'] || '[]');
  }),

  persistMap: observer('map.[]', function() {
    const prefix = get(this, 'prefix');
    const map = get(this, 'map');

    localStorage[prefix + 'map'] = JSON.stringify(map || []);
  }),

  events: computed(function() {
    const prefix = get(this, 'prefix');
    const table = csv.parse(localStorage[prefix + 'events'] || '');
    console.log('table', table);
    const events = table.map(row => Event.create().deserialize(row));

    return events;
  }),

  persistEvents: observer('events.[]', function() {
    const prefix = get(this, 'prefix');
    const events = get(this, 'events');

    localStorage[prefix + 'events'] = events.map(event => event.serialize()).join('\n');
  })
});
