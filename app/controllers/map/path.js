import Ember from 'ember';
import MapController from 'niarc-map-editor/controllers/map';

const {
  get,
  set,
  run,
  computed,
  assign
} = Ember;

export default MapController.extend({
  layers: [{
    name: 'map',
    isVisible: true,
    isSelected: false
  }, {
    name: 'path',
    isVisible: true,
    isSelected: true
  }],

  selectedPoint: computed('path.points.@each.isSelected', function() {
    const points = get(this, 'path.points') || [];
    return points.findBy('isSelected');
  }),

  path: computed('model.events', {
    get() {
      const events = get(this, 'model.events') || [];
      const moveEvents = events.filter(event => get(event, 'Operation') < 2);
      const points = events.map(event => {
        return {
          x: get(event, 'Go to parameters.Point to go to.X') / 10,
          y: get(event, 'Go to parameters.Point to go to.Y') / 10,
          radius: get(event, 'Curve parameters.Radius') / 10,
          isSelected: get(event, 'UI parameters.Selected')
        };
      });

      if (!points || !points.length) {
        return null;
      }

      return {
        type: 'path',
        layer: 'path',
        points,
      };
    },

    set(key, path) {
      this.updateEvents(path);
      return path;
    }
  }),

  updateEvents(path) {
    path = path || get(this, 'path') || {};
    const points = get(path, 'points') || [];

    set(this, 'model.events', points.map(point => {
      return {
        Operation: 1,
        'Go to parameters': {
          'Point to go to': {
            X: get(point, 'x') * 10,
            Y: get(point, 'y') * 10
          },
          'Stop at end of line': true
        },
        'Curve parameters': {
          Radius: Number(get(point, 'radius') || 0) * 10
        },
        'UI parameters': {
          Selected: get(point, 'isSelected')
        }
      };
    }));
  
    this.send('saveModel');
  },

  actions: {
    addPath(path) {
      set(this, 'path', path);
    },

    selectHandle(path, handleIndex) {
      const newPath = assign({}, get(this, 'path'));
      const points = get(newPath, 'points');
      const toSelect = points.objectAt(handleIndex);

      points.forEach(point => {
        set(point, 'isSelected', false);
      });

      set(toSelect, 'isSelected', true);
      set(this, 'path', newPath);
    },

    setPathPoints(path, points) {
      path = path || get(this, 'path') || {};
      
      if (path) {
        set(path, 'points', points);
        run.next(() => this.updateEvents());
      } else {
        console.log('path does not exist :O');
      }
    },

    deselectAll() {
      const path = get(this, 'path') || {};
      const points = get(path, 'points') || [];
      points.forEach(point => set(point, 'isSelected', false));
    },

    setPointProp(prop, value) {
      const point = get(this, 'selectedPoint');

      if (!point) {
        return;
      }

      set(point, prop, value);
      this.updateEvents();
    },

    send() {
      const data = [];

      for (let i = 0; i < Math.random() * 50; i++) {
        data.push(getPayload());
      }

      this.send('sendData', data);
    }
  }
});

function getPayload() {
  return {
    "Operation": Math.floor(Math.random() * 3), // go to point: 0, go to point curved: 1, drop cube: 2
    "Go to parameters": {
      "Point to go to": { "X": 50, "Y": 60 },
      "Point to face": { "X": 50, "Y": 60 },
      "Face": 0, // none: 0, face point: 1, face target: 2
      "Ramp min value": Math.random(),
      "Ramp distance": Math.random() * 100,
      "Error correction P": Math.random(),
      "P saturation": Math.random(),
      "Face point P": Math.random(),
      "Face point P saturation": Math.random(),
      "Max speed": Math.random(),
      "Acceleration": 0.5,
      "Tolerance": 5,
      "Ramp curve exponent": 1.5,
      "Stop at end of line": Math.random() < 0.5
    },
    "Curve parameters": {
      "Radius": 30,
      "Error correction P": 0.01
    },
    "Drop cube parameters": {
      "Servo index": 0 // 0-13
    }
  };
}
