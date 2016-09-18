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
  lastSendTime: null,
  events: [],
  messageListeners: [],

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

  storeAddress: observer('address', function() {
    localStorage.address = get(this, 'address');
  }),

  connect() {
    const socket = new WebSocket('ws://' + get(this, 'address'));
    const self = this;

    // Binary socket
    socket.binaryType = 'arraybuffer';

    set(this, 'isConnecting', true);
    
    socket.onopen = function() {
      console.log('connected');
      set(self, 'isConnected', true);
      set(self, 'isConnecting', false);
      set(self, 'socket', this);
    }

    socket.onmessage = ({ data }) => {
      const castData = new Int16Array(data);

      if (castData[0] === 0) { // Message is an event
        const uint8array = new Uint8Array(data);
        const str = String.fromCharCode(...uint8array);
        const csv = str.trim().split('\n').map(line => line.split(','));

        const events = csv.map(row => Event.create().deserialize(row));

        const allowedTypes = [
          'go-to-point',
          'go-to-wall',
          'drop-cube'
        ];

        // Only include events of allowedTypes
        set(this, 'events', events.filter(({ type }) => allowedTypes.includes(type)));
      } else { // Message type is 1, message is robotData
        const robotData = RobotData.create().deserialize(castData);
        set(this, 'robotData', robotData);
      }
    };
    
    socket.onclose = () => {
      console.log('closed, reconnecting in 10 seconds...');
      set(this, 'isConnected', false);
      run.later(() => this.connect(), 10000);
    };

    set(this, 'socket', socket);
  },

  readI32 : function (data, position) {
      let out = position;
      out = data[position];
      out |= data[position + 1] << 8;
      out |= data[position + 2] << 16;
      out |= data[position + 3] << 24;
      position += 4;
      return out;
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
    const socket = get(this, 'socket') || {};
    const lastSendTime = get(this, 'lastSendTime');
    const pending = get(this, 'throttledMessage');

    if (socket.readyState > 0) {
      if (!lastSendTime || lastSendTime + 1000 < Date.now()) {
        socket.send(payload.toString());
      } else {
        if (pending) {
          run.cancel(pending);
        }

        const scheduledSend = run.later(() => {
          set(this, 'pending', null);
          this.send(payload);
        }, lastSendTime + 1000 - Date.now());

        set(this, 'pending', scheduledSend);
      }
    } else {
      // console.log('No connection');
    }
  }
});