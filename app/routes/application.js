import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  run,
  on,
  assign,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  connection: service(),

  actions: {
    sendData(payload) {
      const connection = get(this, 'connection');
      const serialized = payload.map(p => p.serialize()).join('\n');
      return connection.send(serialized);
    }
  }
});
