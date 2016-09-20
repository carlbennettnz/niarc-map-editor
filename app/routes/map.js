import Ember from 'ember';

const {
  get,
  set,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  data: service(),

  model() {
    return get(this, 'data.map') || [];
  },

  afterModel(model) {
    this._super(...arguments);

    model.forEach(line => {
      set(line, 'isSelected', false);
    });
  },

  actions: {
    saveModel() {
      const map = get(this, 'data.map');

      map.arrayContentDidChange();
      // send to robot
    }
  }
});
