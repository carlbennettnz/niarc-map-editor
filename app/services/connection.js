import Ember from 'ember';
import Event from 'niarc-map-editor/objects/event';

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

  loadStoredAddress: on('init', function() {
    this._super(...arguments);

    if (localStorage.address) {
      set(this, 'address', localStorage.address)
    }
  }),

  storeAddress: observer('address', function() {
    localStorage.address = get(this, 'address');
  }),

  connect() {
    const socket = new WebSocket('ws://' + get(this, 'address'));
    const self = this;

    set(this, 'isConnecting', true);
    
    socket.onopen = function() {
      console.log('connected');
      set(self, 'isConnected', true);
      set(self, 'isConnecting', false);
      set(self, 'socket', this);
    }
    
    socket.onmessage = ({ data }) => {
      const events = data.trim().split('\n').map(event => Event.create().deserialize(event.split(',')));
      const allowedTypes = [
        'go-to-point',
        'go-to-wall',
        'drop-cube'
      ];

      set(this, 'events', events.filter(({ type }) => allowedTypes.includes(type)));
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