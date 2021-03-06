import Ember from 'ember';
import { EKMixin } from 'ember-keyboard';
import * as geometry from 'niarc-map-editor/utils/geometry';

const {
  get,
  set,
  computed,
  observer,
  assert,
  assign,
  on,
  run,
  $
} = Ember;

export default Ember.Component.extend(EKMixin, {
  // Model
  shapes: [],

  // Config
  tools: [],
  keyboardActivated: true,
  gridSize: 200,
  clickToSelectTolerance: 100, // how many pixels away can you click and still select the shape?
  viewport: {
    scrollX: 0,
    scrollY: 0,
    zoom: 1
  },

  selectedEventIds: computed.mapBy('selectedEvents', 'id'),

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
    const y = get(this, 'viewportHeight') - get(this, 'viewport.scrollY');

    return `translate(${x}, ${y}) scale(1, -1)`;
  }),

  selectedLayerName: computed('layers.@each.isSelected', function() {
    const layer = (get(this, 'layers') || []).findBy('isSelected');
    return get(layer || {}, 'name');
  }),

  handleZoom: on('didInsertElement', function() {
    this.$().on('mousewheel', event => {
      const oldZoom = get(this, 'viewport.zoom');
      const newZoom = Math.max(oldZoom + event.originalEvent.wheelDelta / 5000, 0.05);
      const splitX = event.originalEvent.clientX - get(this, 'viewport.scrollX');
      const splitY = event.originalEvent.clientY - get(this, 'totalYOffset');

      run(() => {
        set(this, 'viewport', {
          scrollX: event.originalEvent.clientX - splitX * newZoom / oldZoom,
          scrollY: get(this, 'viewportHeight') - (event.originalEvent.clientY - splitY * newZoom / oldZoom),
          zoom: newZoom
        });
      });
    });
  }),

  toolDidChange: observer('tool', on('init', function() {
    set(this, 'toolState', {});
    $('body').attr('data-tool', get(this, 'tool'));
  })),

  getScaledAndOffsetPoint(x, y) {
    const scrollX = get(this, 'viewport.scrollX');
    const scrollY = get(this, 'viewport.scrollY');
    const zoom = get(this, 'viewport.zoom');
    const viewportHeight = get(this, 'viewportHeight');

    return {
      x: Math.round((x - scrollX) / zoom),
      y: Math.round((viewportHeight - y - scrollY) / zoom)
    };
  },

  snapPointToGrid(point, gridSize) {
    if (!gridSize) {
      const zoom = get(this, 'viewport.zoom');
      const defaultGridSize = get(this, 'gridSize');

      gridSize = zoom > 0.4 ? defaultGridSize / 20 : defaultGridSize;
    }

    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  },

  snapPointsToAxis(fixed, variable) {
    const xSize = Math.abs(get(fixed, 'x') - get(variable, 'x'));
    const ySize = Math.abs(get(fixed, 'y') - get(variable, 'y'));

    // Snap to an axis
    return {
      x: xSize > ySize ? get(variable, 'x') : get(fixed, 'x'),
      y: xSize > ySize ? get(fixed, 'y') : get(variable, 'y')
    };
  }
});
