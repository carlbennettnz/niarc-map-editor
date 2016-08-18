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

  connect() {
    const socket = new WebSocket('ws://10.140.124.43:8080');
    const self = this;

    set(this, 'isConnecting', true;)
    
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

  send(payload) {
    const socket = get(this, 'socket');

    if (socket.readyState > 0) {
      socket.send(JSON.stringify(payload));
    } else {
      console.log('No connection');
    }
  }
});