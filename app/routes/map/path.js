import Ember from 'ember';

const {
  get,
  set,
  RSVP
} = Ember;

export default Ember.Route.extend({
  model() {
    return RSVP.hash({
      map: this.modelFor('map'),
      events: [{
        type: 'move',
        name: 'Move',
        points: [
          { x: 20, y: 20 },
          { x: 100, y: 100, radius: 10 },
          { x: 100, y: 20 }
        ]
      }]
    });
  },

  afterModel(model) {
    this._super(...arguments);

    (get(model, 'map') || []).forEach(line => {
      set(line, 'isSelected', false);
    });
  }
});
