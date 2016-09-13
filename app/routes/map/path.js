import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  run,
  RSVP
} = Ember;

export default Ember.Route.extend({
  model() {
    const key = config.environment === 'test' ? 'events-test' : 'events';
    let events = [];

    try {
      events = JSON.parse(localStorage[key] || '[]');
    } catch (err) {
      console.error(err);
    }

    return RSVP.hash({
      map: this.modelFor('map'),
      events: events.map((eventSource, i) => {
        const event = Event.create(eventSource);

        set(event, 'id', i);

        return event;
      })
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
      localStorage['events' + envSuffix] = JSON.stringify(get(this, 'controller.model.events') || []);
      this.send('sendData', get(this, 'controller.model.events'));
    }
  }
});
