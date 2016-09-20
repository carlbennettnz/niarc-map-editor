import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';

const {
  get,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  connection: service(),
  data: service(),

  actions: {
    saveEvents() {
      const connection = get(this, 'connection');
      const events = get(this, 'data.events');

      events.arrayContentDidChange();
      connection.sendEvents(events);
    }
  }
});
