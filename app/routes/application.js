import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import Event from 'niarc-map-editor/objects/event';

const {
  get,
  set,
  run,
  on,
  assign,
  inject: { service }
} = Ember;

export default Ember.Route.extend({
  connection: service(),

  model() {
    const key = config.environment === 'test' ? 'events-test' : 'events';
    let events = [];

    try {
      events = JSON.parse(localStorage[key] || '[]');
    } catch (err) {
      console.error(err);
    }

    return events.map((eventSource, i) => Event.create(eventSource));
  },

  updateModel: on('connection.message', function(message) {
    const events = message.split('\n').map(event => Event.create().deserialize(event));
    set(this, 'pathRoute.model', events);
    get(this, 'pathRoute').send('saveModel');
  }),

  actions: {
    sendData(payload) {
      const connection = get(this, 'connection');
      const serialized = payload.map(p => p.serialize()).join('\n');
      return connection.send(serialized);
    }
  }
});

function getPayload() {
  return {
    "Operation": Math.floor(Math.random() * 3), // go to point: 0, go to point curved: 1, drop cube: 2
    "Go to parameters": {
      "Point to go to": { "X": Math.random(), "Y": Math.random() },
      "Point to face": { "X": Math.random(), "Y": Math.random() },
      "Face": Math.floor(Math.random() * 3), // none: 0, face point: 1, face target: 2
      "Ramp min value": Math.random(),
      "Ramp distance": Math.random() * 100,
      "Error correction P": Math.random(),
      "P saturation": Math.random(),
      "Face point P": Math.random(),
      "Face point P saturation": Math.random(),
      "Max speed": Math.random(),
      "Acceleration": Math.random(),
      "Tolerance": Math.random(),
      "Ramp curve exponent": Math.random(),
      "Stop at end of line": Math.random() < 0.5
    },
    "Curve parameters": {
      "Radius": Math.random(),
      "Error correction P": Math.random()
    },
    "Drop cube parameters": {
      "Servo index": Math.floor(Math.random() * 100) // 0-13
    }
  };
}
