import Ember from 'ember';

const {
  get,
  set,
  on,
  getProperties,
  computed
} = Ember;

export default Ember.Component.extend({
  classNames: [ 'path-preview' ],

  viewportHeight: 0,

  updateViewportHeight: on('init', function() {
    set(this, 'viewportHeight', $(window).height());

    $(window).on('resize', function() {
      run(() => set(this, 'viewportHeight', $(window).height()));
    })
  }),

  totalYOffset: computed('viewport.scrollY', 'viewportHeight', function() {
    return get(this, 'viewportHeight') - get(this, 'viewport.scrollY');
  }),

  scrollTransform: computed('viewport.scrollX', 'viewport.scrollY', 'viewportHeight', function() {
    const x = get(this, 'viewport.scrollX');
    const y = 150 - get(this, 'viewport.scrollY');

    return `translate(${x}, ${y}) scale(1, -1)`;
  }),

  viewport: computed('instructions.path.points.@each.{x,y}', function() {
    const instructions = get(this, 'instructions');

    const limits = {
      left: null,
      right: null,
      top: null,
      bottom: null
    };

    // Find extreme points
    get(instructions, 'path.points').forEach(point => {
      const { x, y } = getProperties(point, 'x', 'y');
      
      if (!limits.left   || x < limits.left)   limits.left   = x;
      if (!limits.right  || x > limits.right)  limits.right  = x;
      if (!limits.top    || y < limits.top)    limits.top    = y;
      if (!limits.bottom || y > limits.bottom) limits.bottom = y;
    });

    // The maximum possible zoom level while keeping all points in frame
    const xZoom = 278 / (limits.right - limits.left);
    const yZoom = 150 / (limits.bottom - limits.top);

    // Use the minimum
    if (xZoom < yZoom) {
      return {
        scrollX: -limits.left * xZoom,
        scrollY: (150 - (limits.bottom - limits.top) * xZoom) / 2, // Center in available space
        zoom: xZoom
      };
    } else {
      return {
        scrollX: (278 - (limits.right - limits.left) * yZoom) / 2, // Center in available space
        scrollY: -limits.top * yZoom,
        zoom: yZoom
      };
    }
  }),

  click() {
    this.sendAction('click');
  }
});
