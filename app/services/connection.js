import Ember from 'ember';

const {
  get,
  set,
  run,
  assign
} = Ember;

export default Ember.Service.extend({
  isConnected: false,
  isConnecting: false,
  socket: null,
  address: '192.168.1.4:8090',

  connect() {
    const socket = new WebSocket('ws://' + get(this, 'address'));
    const self = this;

    set(this, 'isConnecting', true);
    
    socket.onopen = function() {
      console.log('connected');
      set(this, 'isConnected', true);
      set(this, 'isConnecting', false);
      set(self, 'socket', this);
    }
    
    socket.onmessage = ({ data }) => console.log('recevied', data);
    
    socket.onclose = () => {
      console.log('closed, reconnecting in 10 seconds...');
      set(this, 'isConnected', false);
      run.later(() => this.connect(), 10000);
    };

    // Handle connection timeouts
    // run.later(() => {
    //   console.log('timed out, closing...');
    //   socket.readyState ? socket.close() : this.connect();
    // }, 10000);

    set(this, 'socket', socket);
  },

  disconnect() {
    const socket = get(this, 'socket');

    socket.onclose = () => {};
    socket.close();

    set(this, 'socket', null);
    set(this, 'isConnecting', false);
    set(this, 'isConnected', false);
  },

  send(payload) {
    const socket = get(this, 'socket') || {};

    if (socket.readyState > 0) {
      socket.send(payload.toString());
    } else {
      // console.log('No connection');
    }
  }
});