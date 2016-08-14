import Ember from 'ember';
import { scale } from 'niarc-map-editor/helpers/scale';

const {
  get,
  computed
} = Ember;

export default Ember.Component.extend({
  path: computed('line.points.@each.x', 'line.points.@each.y', function() {
    const points = get(this, 'line.points') || [];
    const zoom = get(this, 'viewport.zoom');
    const parts = [];

    const scaledPoint = (point) => {
      const x = scale([ get(point, 'x'), zoom ]);
      const y = scale([ get(point, 'y'), zoom ]);
      return `${x},${y}`;
    }

    points.forEach(point => {
      parts.push(scaledPoint(point));
    });

    return 'M' + parts.join(' L');
  })
});
