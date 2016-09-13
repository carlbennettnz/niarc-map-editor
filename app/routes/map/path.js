import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  run,
  RSVP,
  computed,
  Object: EmberObject,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  connection: service(),

  model() {
    return EmberObject.create({
      map: this.modelFor('map')
    });
  },

  afterModel(model) {
    this._super(...arguments);

    (get(model, 'map') || []).forEach(line => {
      set(line, 'isSelected', false);
    });

    (get(model, 'events') || []).filterBy('type', 'path').forEach(path => {
      set(path, 'isSelected', false);
      (get(path, 'points') || []).forEach(point => set(point, 'isSelected', false));
    });
  },

  actions: {
    saveModel() {
      const envSuffix = config.environment === 'test' ? '-test' : '';
      localStorage['map' + envSuffix] = JSON.stringify(get(this, 'controller.model.map') || []);
      localStorage['events' + envSuffix] = JSON.stringify(get(this, 'controller.connection.events') || []);
      this.send('sendData', get(this, 'controller.connection.events'));
    }
  }
});
