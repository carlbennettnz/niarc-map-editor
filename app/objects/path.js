import Ember from 'ember';

const {
  get,
  set
} = Ember;

export default Ember.Object.extend({
  points: [],
  type: 'path',
  layer: null,

  deselectAllPoints() {
    const points = get(this, 'points');

    points.forEach(point => set(point, 'isSelected', false));
  },

  selectPoint(index) {
    get(this, 'points').forEach((point, i) => {
      set(point, 'isSelected', index === i);
    });
  },

  highlightPoint(index) {
    get(this, 'points').forEach((point, i) => {
      set(point, 'isHighlighted', index === i);
    });
  },

  removePoints(pointsToRemove) {
    const points = get(this, 'points');

    pointsToRemove.forEach(point => points.removeObject(point));
  },

  getPointsInRect({ x1, y1, x2, y2 }) {
    const points = get(this, 'points');

    if (x1 > x2) {
      [ x1, x2 ] = [ x2, x1 ];
    }

    if (y1 > y2) {
      [ y1, y2 ] = [ y2, y1 ];
    }

    const pointsInRect = points.filter(point => {
      const { x, y } = point.getProperties([ 'x', 'y' ]);

      return x > x1 && x < x2 && y > y1 && y < y2;
    });

    return pointsInRect;
  }
});
