import Ember from 'ember';

const {
  get,
  set,
  on,
  run,
  getProperties,
  computed
} = Ember;

export default Ember.Component.extend({
  classNames: [ 'path-preview' ],

  width: 278,
  height: 150,

  totalYOffset: computed('viewport.scrollY', 'viewportHeight', function() {
    return get(this, 'viewportHeight') - get(this, 'viewport.scrollY');
  }),

  scrollTransform: computed('viewport.scrollX', 'viewport.scrollY', 'viewportHeight', function() {
    const x = get(this, 'viewport.scrollX');
    const y = get(this, 'height') - get(this, 'viewport.scrollY');

    return `translate(${x}, ${y}) scale(1, -1)`;
  }),

  viewport: computed('instructions.path.points.@each.{x,y}', function() {
    const points = get(this, 'instructions.path.points');
    const width = get(this, 'width');
    const height = get(this, 'height');

    if (!points.length) {
      return {
        scrollX: 0,
        scrollY: 0,
        zoom: 1
      };
    }

    const limits = {
      left: null,
      right: null,
      top: null,
      bottom: null
    };

    // Find extreme points
    points.forEach(point => {
      const { x, y } = getProperties(point, 'x', 'y');
      
      if (!limits.left   || x < limits.left)   limits.left   = x;
      if (!limits.right  || x > limits.right)  limits.right  = x;
      if (!limits.bottom || y < limits.bottom) limits.bottom = y;
      if (!limits.top    || y > limits.top)    limits.top    = y;
    });

    // The maximum possible zoom level while keeping all points in frame
    const xZoom = width / (limits.right - limits.left);
    const yZoom = height / (limits.top - limits.bottom);

    // Use the minimum
    if (xZoom < yZoom) {
      console.log(-limits.bottom * xZoom, (limits.top - limits.bottom) * xZoom);
      return {
        scrollX: -limits.left * xZoom,
        scrollY: -limits.bottom * xZoom + (height - (limits.top - limits.bottom) * xZoom) / 2, // Center in available space
        zoom: xZoom
      };
    } else {
      return {
        scrollX: (width - (limits.right - limits.left) * yZoom) / 2, // Center in available space
        scrollY: -limits.bottom * yZoom,
        zoom: yZoom
      };
    }
  }),

  click() {
    this.sendAction('click');
  }
});
