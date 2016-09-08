import Ember from 'ember';
import MapController from 'niarc-map-editor/controllers/map';
import Event from 'niarc-map-editor/objects/event';
import Path from 'niarc-map-editor/objects/path';
import PathPoint from 'niarc-map-editor/objects/path-point';

const {
  get,
  set,
  run,
  computed,
  assign,
  inject: { service }
} = Ember;

export default MapController.extend({
  connection: service(),

  tool: 'path',

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
      const points = get(this, 'model.events') || [];

      if (!points || !points.length) {
        return null;
      }

      return Path.create({
        type: 'path',
        layer: 'path',
        points: points.map(point => PathPoint.create(point))
      });
    },

    set(key, path) {
      this.updateEvents(path);
      return path;
    }
  }),

  actions: {
    selectTool(tool) {
      set(this, 'tool', tool);
    },

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

    setPathPoints(points) {
      const path = get(this, 'path');
      
      if (path) {
        set(path, 'points', points);
        this.send('updateEvents');
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
      this.send('updateEvents');
    },

    highlightPoint(point) {
      const points = get(this, 'path.points') || [];

      points.forEach(p => set(p, 'isHighlighted', false));

      if (point) {
        set(point, 'isHighlighted', true);
      }
    },

    connect() {
      const connection = get(this, 'connection');
      connection.connect();
    },

    disconnect() {
      const connection = get(this, 'connection');
      connection.disconnect();
    },

    updateEvents(path) {
      path = path || get(this, 'path') || {};
      const points = get(path, 'points') || [];
      set(this, 'model.events', points.map(point => Event.create(point)));
      console.log('saving');
      this.send('saveModel');
    }
  }
});
