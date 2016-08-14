import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';

const {
  get
} = Ember;

export default Ember.Route.extend({
  model() {
    const key = config.environment === 'test' ? 'map-test' : 'map';

    try {
      return JSON.parse(localStorage[key] || '[]');
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  actions: {
    saveModel() {
      const key = config.environment === 'test' ? 'map-test' : 'map';
      localStorage[key] = JSON.stringify(get(this, 'controller.shapes') || []);
    }
  }
});
