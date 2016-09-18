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

    const robotDataX = castData.splice(0, 2);
    const robotX = robotDataX[1] | robotDataX[0] << 16;

    const robotDataY = castData.splice(0, 2);
    const robotY = robotDataY[1] | robotDataY[0]  << 16;

    const robotDataRotation = castData.splice(0, 2);
    const robotRotation = robotDataRotation[1] | robotDataRotation[0] << 16;
    
    set(this, 'robotPose.x', robotX / 1000);
    set(this, 'robotPose.y', robotY / 1000);
    set(this, 'robotPose.rotation', robotRotation / 1000);
    set(this, 'lidarPoints', []);

    while (castData.length > 0)  {
      lidarPoints.pushObject({
        x: castData.shift(),
        y: castData.shift()
      });
    }

    return this;
  }

});
