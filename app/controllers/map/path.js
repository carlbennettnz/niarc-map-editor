import Ember from 'ember';
import MapController from 'niarc-map-editor/controllers/map';

const {
  get,
  set,
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
      const moveEvents = events.filterBy('type', 'path');
      const points = moveEvents.mapBy('point');

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
      const points = get(path, 'points') || [];
      set(this, 'model.events', points.map(point => ({
        type: 'path',
        point
      })));
      this.send('saveModel');
      return path;
    }
  }),

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
      const newPath = assign({}, path, { points });
      set(this, 'path', newPath);
      this.send('saveModel');
    },

    deselectAll() {
      const path = get(this, 'path') || {};
      const points = get(path, 'points') || [];
      points.forEach(point => set(point, 'isSelected', false));
    }
  }
});
