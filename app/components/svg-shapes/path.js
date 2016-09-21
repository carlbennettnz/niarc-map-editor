import Ember from 'ember';

const {
  get,
  computed
} = Ember;

export default Ember.Component.extend({
  getScaledPoint(point) {
    const zoom = get(this, 'viewport.zoom');
    const x = get(point, 'x') * zoom;
    const y = get(point, 'y') * zoom;
    return `${x},${y}`;
  },

  constructionPath: computed('line.points.@each.x', 'line.points.@each.y', 'viewport.zoom', function() {
    const points = get(this, 'line.points') || [];
    const parts = [];

    if (!points.length) {
      return '';
    }

    points.forEach(point => {
      parts.push(this.getScaledPoint(point));
    });

    return 'M' + parts.join(' L');
  }),

  path: computed('line.points.@each.x', 'line.points.@each.y', 'line.points.@each.radius', 'viewport.zoom', function() {
    const points = get(this, 'line.points') || [];
    const zoom = get(this, 'viewport.zoom');
    let str = '';

    if (!points.length) {
      return '';
    }

    str += 'M ' + this.getScaledPoint(points[0]);

    for (let i = 1; i < points.length; i++) {
      const radius = get(points[i], 'radius');

      if (radius && i < points.length - 1) {
        let pointsInQuestion = [
          points[i - 1],
          points[i],
          points[i + 1]
        ];

        let vectors = [
          getVector(points[i], points[i - 1]),
          getVector(points[i], points[i + 1])
        ];

        let angleBetweenLines = getAngleOf(vectors[0]) - getAngleOf(vectors[1]);
        let flag = 1;

        // Ensures the circle is always in the acute angle
        if ((angleBetweenLines + 2 * Math.PI) % (2 * Math.PI) > Math.PI) {
          angleBetweenLines *= -1;
          flag = 0;
        }

        const bisectorAngle = (getAngleOf(vectors[0]) + getAngleOf(vectors[1])) / 2;
        const bisectorLength = radius / Math.sin(angleBetweenLines / 2)
        const distanceDownArms = Math.sqrt(bisectorLength * bisectorLength - radius * radius);

        const start = {
          x: get(pointsInQuestion[1], 'x') + distanceDownArms * Math.cos(getAngleOf(vectors[0])),
          y: get(pointsInQuestion[1], 'y') + distanceDownArms * Math.sin(getAngleOf(vectors[0]))
        };

        const mid = {
          x: get(pointsInQuestion[1], 'x'),
          y: get(pointsInQuestion[1], 'y')
        };

        const end = {
          x: get(pointsInQuestion[1], 'x') + distanceDownArms * Math.cos(getAngleOf(vectors[1])),
          y: get(pointsInQuestion[1], 'y') + distanceDownArms * Math.sin(getAngleOf(vectors[1]))
        };

        const final = [ mid, end ].map(p => this.getScaledPoint(p)).map(s => s.replace(',', ' '));

        str += ' L ' + this.getScaledPoint(start);
        str += ` Q ${final.join(' ')}`;
      } else {
        str += ' L ' + this.getScaledPoint(points[i]);
      }
    }

    return str;
  })
});

function getVector(a, b) {
  return {
    x: get(b, 'x') - get(a, 'x'),
    y: get(b, 'y') - get(a, 'y')
  };
}

function getAngleOf(vector) {
  return Math.atan2(vector.y, vector.x);
}
