import Ember from 'ember';
import csv from 'niarc-map-editor/utils/csv';
import Event from 'niarc-map-editor/objects/event';
import Path from 'niarc-map-editor/objects/path';

const {
  get,
  set,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  data: service(),

  model() {
    const data = get(this, 'data');

    return data.findAll('instructions').then(instructions => {
      instructions.forEach(instructionSet => {
        const table = csv.parse(get(instructionSet, 'events'));
        const events = table.map(row => Event.create().deserialize(row));
        const pointEvents = events.filterBy('type', 'go-to-point');
        const path = Path.create().fromEvents(pointEvents);

        set(instructionSet, 'path', path);
      });

      return instructions;
    });
  }
});
