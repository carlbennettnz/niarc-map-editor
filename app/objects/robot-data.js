import Ember from 'ember';

const {
  get,
  set,
  isEmpty
} = Ember;

let nextId = 0;

export default Ember.Object.extend({
  init() {
    this._super(...arguments);
    set(this, 'id', nextId);
    nextId++;
  },

  id: null,
  robotPose: {
    x: 0,
    y: 0,
    rotation: 0
  },

  lidarPoints: [],

  deserialize(castData) {
    const lidarPoints = get(this, 'lidarPoints');

    const robotX = this.readI32(castData);
    const robotY = this.readI32(castData);
    const robotRotation = this.readI32(castData);
    
    set(this, 'robotPose.x', robotX / 1000);
    set(this, 'robotPose.y', robotY / 1000);
    set(this, 'robotPose.rotation', robotRotation / 1000);
    set(this, 'lidarPoints', []);

    while (castData.length > 0)  {
      lidarPoints.pushObject({
        x: this.readI16(castData),
        y: this.readI16(castData)
      });
    }

    return this;
  },

  readI32(data) {
    return data.shift() << 24
    | data.shift() << 16
    | data.shift() << 8
    | data.shift();
  },

  readI16(data) {
    return data.shift() << 8
    | data.shift();
  }
});
