import Ember from 'ember';
import Event from 'niarc-map-editor/objects/event';
import RobotData from 'niarc-map-editor/objects/robot-data';


const {
  get,
  set,
  run,
  on,
  observer,
  assign
} = Ember;

export default Ember.Service.extend({
  isConnected: false,
  isConnecting: false,
  socket: null,
  address: '192.168.1.5:4000',
  events: [],

  loadStoredAddress: on('init', function() {
    this._super(...arguments);

    if (localStorage.address) {
      set(this, 'address', localStorage.address)
    }
  }),

  enableSaveAndLoad: on('init', function() {
    window.save = () => JSON.stringify(get(this, 'events'));
    window.load = events => {
      if (typeof events === 'string') {
        events = JSON.parse(events);
      }

      set(this, 'events', events.map(event => Event.create(event)));
    };
  }),

  onMessage(func) {
    const messageListeners = get(this, 'messageListeners');
    messageListeners.pushObject(func);
  },

  connect() {
    const socket = new WebSocket('ws://' + get(this, 'address'));
    const self = this;

    // Binary socket
    socket.binaryType = 'arraybuffer';

    set(this, 'isConnecting', true);
    
    socket.onopen = function() {
      set(self, 'isConnected', true);
      set(self, 'isConnecting', false);
      set(self, 'socket', this);
    }

    socket.onmessage = ({ data }) => {
      const message = Array.from(new Uint8Array(data));
      const type = message.shift();

      switch (type) {
        // Message is an event
        case 0:
          const csvStr = String.fromCharCode(...message);
          const csvTable = csvStr.trim().split('\n').map(line => line.split(','));
          const events = csvTable.map(row => Event.create().deserialize(row));

          const allowedTypes = [
            'go-to-point',
            'go-to-wall',
            'drop-cube',
            'toggle-localisation',
            'wait'
          ];

          // Only include events of allowedTypes
          set(this, 'events', events.filter(({ type }) => allowedTypes.includes(type)));

          break;
        
        // Message type is 1, message is robotData
        case 1:
          const robotData = RobotData.create().deserialize(message);
          set(this, 'robotData', robotData);

          break;

        default:
          console.error('Unknown data type: ' + type);
      }
    };
    
    socket.onclose = () => {
      console.log('closed, reconnecting in 10 seconds...');
      set(this, 'isConnected', false);
      run.later(() => this.connect(), 10000);
    };

    set(this, 'socket', socket);
  },

  disconnect() {
    const socket = get(this, 'socket');

    if (!socket || !(socket instanceof WebSocket)) {
      return;
    }

    socket.onclose = () => {};
    socket.close();

    set(this, 'socket', null);
    set(this, 'isConnecting', false);
    set(this, 'isConnected', false);
  },

  send(payload) {
    const socket = get(this, 'socket');

    if (socket && socket.readyState > 0) {
      socket.send(payload.toString());
    }
  },

  sendEvents(events = []) {
    const serialized = events.map(event => {
      console.log(event)
      return event.serialize()
    }).join('\n');

    this.send(serialized);
  }
});