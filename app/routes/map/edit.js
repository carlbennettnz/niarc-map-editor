import Ember from 'ember';

const {
  set
} = Ember;

export default Ember.Route.extend({
  model() {
    return this.modelFor('map');
  },

  afterModel(model) {
    this._super(...arguments);

    (model || []).forEach(line => {
      set(line, 'isSelected', false);
    });
  }
});
