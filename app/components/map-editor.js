import Ember from 'ember';

const {
  get,
  set,
  computed
} = Ember;

export default Ember.Component.extend({
  lineInProgress: null,
  gridSize: 20,

  lines: [],

  allLines: computed('lines.[]', 'lineInProgress', function() {
    const allLines = [];
    const lines = get(this, 'lines') || [];
    const inProgress = get(this, 'lineInProgress');

    allLines.push(...lines);

    if (inProgress) {
      allLines.push(inProgress);
    }

    return allLines;
  }),

  mouseDown(event) {
    const gridSize = get(this, 'gridSize');

    get(this, 'lines').forEach(line => set(line, 'isSelected', false));

    set(this, 'lineInProgress', {
      points: {
        x1: Math.round(event.offsetX / gridSize) * gridSize,
        y1: Math.round(event.offsetY / gridSize) * gridSize,
        x2: Math.round(event.offsetX / gridSize) * gridSize,
        y2: Math.round(event.offsetY / gridSize) * gridSize
      },
      isSelected: true,
      isInProgress: true
    });
  },

  mouseMove(event) {
    const line = get(this, 'lineInProgress');
    const gridSize = get(this, 'gridSize');

    if (!line || get(this, 'isDestroying')) {
      return;
    }

    if (!event.buttons) {
      set(this, 'lineInProgress', null);
      return;
    }

    const xSize = Math.abs(get(line, 'points.x1') - event.offsetX);
    const ySize = Math.abs(get(line, 'points.y1') - event.offsetY);

    // Snap to an axis
    if (xSize > ySize) {
      set(line, 'points.x2', Math.round(event.offsetX / gridSize) * gridSize);
      set(line, 'points.y2', get(line, 'points.y1'));
    } else {
      set(line, 'points.x2', get(line, 'points.x1'));
      set(line, 'points.y2', Math.round(event.offsetY / gridSize) * gridSize);
    }
  },

  mouseUp() {
    const line = get(this, 'lineInProgress');

    if (get(line, 'points.x1') !== get(line, 'points.x2') || get(line, 'points.y1') !== get(line, 'points.y2')) {
      set(line, 'isInProgress', false);
      this.sendAction('addLine', line);
    }

    set(this, 'lineInProgress', null);
  },

  actions: {
    clear() {
      this.sendAction('clear');
    }
  }
});
