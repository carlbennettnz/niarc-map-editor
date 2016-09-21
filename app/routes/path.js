import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import csv from 'niarc-map-editor/utils/csv';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  run,
  RSVP,
  observer,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  connection: service(),
  data: service(),

  model({ id = 1 }) {
    const data = get(this, 'data');

    return data.find('instructions', id).then(instructionSet => {
      if (!instructionSet) {
        const error = new Error('Not found');
        error.status = 404;
        throw error;
      }

      const table = csv.parse(instructionSet.events);
      const events = table.map(row => Event.create().deserialize(row));
      const map = get(this, 'data.map');

      return { instructionSet, map, events };
    });
  },

  actions: {
    error(err) {
      if (err.status === 404) {
        this.intermediateTransitionTo('/not-found');
      } else {
        return true;
      }
    },

    saveEvents() {
      const data = get(this, 'data');
      const connection = get(this, 'connection');
      const instructionSet = get(this, 'controller.model.instructionSet');
      const events = get(this, 'controller.model.events');
      const lastSave = get(this, 'save');

      set(instructionSet, 'events', events.map(event => event.serialize()).join('\n'));

      if (lastSave) {
        run.cancel(lastSave);
      }

      const save = run.debounce(() => data.update('instructions', instructionSet), 200);

      set(this, 'save', save);
      connection.sendEvents(events);
    }
  }
});
