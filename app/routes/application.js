import Ember from 'ember';

const {
  get,
  set,
  run,
  assign
} = Ember;

export default Ember.Route.extend({
  init() {
    this._super(...arguments);
    this.connect();
  },

  connect() {
    console.log('connecting...');
    const socket = new WebSocket('ws://10.140.124.43:8080');

    const self = this;
    socket.onopen = function() {
      console.log('connected');
      set(self, 'socket', this);
    }
    socket.onmessage = ({ data }) => console.log('recevied', data);
    socket.onclose = () => {
      console.log('closed, reconnecting...');
      this.connect();
    };

    // Handle connection timeouts
    // run.later(() => {
    //   console.log('timed out, closing...');
    //   socket.readyState ? socket.close() : this.connect();
    // }, 10000);

    set(this, 'socket', socket);
  },

  actions: {
    sendData(payload) {
      
      const socket = get(this, 'socket');
      
      if (socket && socket.readyState) {
        socket.send(JSON.stringify(payload.map(p => {
          const s = getPayload();

          s.Operation = p['Curve parameters'].Radius > 0 ? 1 : 0;
          assign(s['Go to parameters'], p['Go to parameters']);
          assign(s['Curve parameters'], p['Curve parameters']);

          // delete p['UI parameters'];
          // p['Go to parameters']['Face'] = Math.floor(Math.random() * 3);
          // console.log(p['Curve parameters']['Radius']);
          return s;
        })));
        console.log('sending...');
      } else {
        console.log('no connction', !socket || socket.readyState);
      }
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
