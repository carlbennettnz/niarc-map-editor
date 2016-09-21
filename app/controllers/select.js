import Ember from 'ember';

export default Ember.Controller.extend({
  paths: [{
    viewport: {
      scrollX: 0,
      scrollY: 0,
      zoom: 1
    },

    path: {
      points: [
        { x: 20, y: 1 },
        { x: 190, y: 1 },
        { x: 120, y: 30 },
        { x: 250, y: 150 },
        { x: 20, y: 20 }
      ],
      type: 'path',
      layer: 'path'
    }
  }, {
    viewport: {
      scrollX: 0,
      scrollY: 0,
      zoom: 1
    },

    path: {
      points: [
        { x: 20, y: 20 },
        { x: 280, y: 60 },
        { x: 30, y: 60 },
        { x: 30, y: 150 },
        { x: 200, y: 140 }
      ],
      type: 'path',
      layer: 'path'
    }
  }, {
    viewport: {
      scrollX: 0,
      scrollY: 0,
      zoom: 1
    },

    path: {
      points: [
        { x: 40, y: 1 },
        { x: 250, y: 1 },
        { x: 250, y: 140 },
        { x: 40, y: 140 },
        { x: 40, y: 20 }
      ],
      type: 'path',
      layer: 'path'
    }
  }, ],

  layers: [{
    name: 'path',
    isVisible: true,
    isSelected: false
  }],

  actions: {
    showPath(path) {
      this.transitionToRoute('path');
    }
  }
});
