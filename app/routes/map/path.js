import Ember from 'ember';

const {
  get,
  set,
  RSVP
} = Ember;

export default Ember.Route.extend({
  model() {
    return RSVP.hash({
      lines: this.modelFor('map'),
      events: [
        { type: 'move', name: 'Move' },
        { type: 'move', name: 'Move' },
        { type: 'move', name: 'Move' },
        { type: 'move', name: 'Move' }
      ]
    });
  },

  afterModel(model) {
    this._super(...arguments);

    (get(model, 'lines') || []).forEach(line => {
      set(line, 'isSelected', false);
    });
  }
});
