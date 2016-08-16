import Ember from 'ember';
import { scale } from 'niarc-map-editor/helpers/scale';

const {
  get,
  computed
} = Ember;

export default Ember.Component.extend({
  constructionPath: computed('line.points.@each.x', 'line.points.@each.y', function() {
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
  }),

  path: computed('line.points.@each.x', 'line.points.@each.y', function() {
    const points = get(this, 'line.points') || [];
    const zoom = get(this, 'viewport.zoom');
    let str = '';

    const scaledPoint = (point) => {
      const x = scale([ get(point, 'x'), zoom ]);
      const y = scale([ get(point, 'y'), zoom ]);
      return `${x},${y}`;
    }

    str += 'M' + scaledPoint(points[0]);

    for (let i = 1; i < points.length; i++) {
      const radius = get(points[i], 'radius') * zoom;

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
          // vectors = vectors.reverse();
          // pointsInQuestion = pointsInQuestion.reverse();
          angleBetweenLines *= -1;
          flag = 0;
        }

        const bisectorAngle = (getAngleOf(vectors[0]) + getAngleOf(vectors[1])) / 2;
        const bisectorLength = radius / Math.sin(angleBetweenLines / 2)
        const distanceDownArms = Math.sqrt(bisectorLength * bisectorLength - radius * radius);

        const centerOfCircle = {
          x: pointsInQuestion[1].x + bisectorLength * Math.cos(bisectorAngle),
          y: pointsInQuestion[1].y + bisectorLength * Math.sin(bisectorAngle)
        };

        const start = {
          x: pointsInQuestion[1].x + distanceDownArms * Math.cos(getAngleOf(vectors[0])),
          y: pointsInQuestion[1].y + distanceDownArms * Math.sin(getAngleOf(vectors[0]))
        };
        console.log(pointsInQuestion, start)

        const end = {
          x: pointsInQuestion[1].x + distanceDownArms * Math.cos(getAngleOf(vectors[1])),
          y: pointsInQuestion[1].y + distanceDownArms * Math.sin(getAngleOf(vectors[1]))
        }

        console.log(distanceDownArms);

        str += ' L' + scaledPoint(start);
        str += ` A ${radius} ${radius} 0 0 ${flag} ` + scaledPoint(end);
      } else {
        str += ' L' + scaledPoint(points[i]);
      }
    }

    return str;
  })
});

function getVector(a, b) {
  return {
    x: b.x - a.x,
    y: b.y - a.y
  };
}

function getAngleOf(vector) {
  return Math.atan2(vector.y, vector.x);
}
