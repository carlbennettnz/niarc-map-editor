import Ember from 'ember';

const {
  get,
  set,
  computed
} = Ember;

export default Ember.Component.extend({
  lineInProgress: null,
  gridSize: 20,
  clickToSelectTolerance: 10, // how many pixels away can you click and still select the line?

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
      isInProgress: true,
      isHidden: true
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

    set(line, 'isHidden', false);

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

    if (!get(line, 'isHidden')) {
      set(line, 'isInProgress', false);
      this.sendAction('add', line);
    }

    set(this, 'lineInProgress', null);
  },

  click(event) {
    // Reverse because we want to select lines on top first and the last lines render on top
    const lines = (get(this, 'lines') || []).reverse();
    const tolerance = get(this, 'clickToSelectTolerance');
    const x = event.offsetX;
    const y = event.offsetY;

    for (let i = 0; i < lines.length; i++) {
      const line = lines.objectAt(i);

      // Yes, line.points.x1 would work, but doing it this way ensures Ember observers are triggered
      // and computed properties are refreshed, if we one day wanted to add some.
      const p = {
        x1: get(line, 'points.x1'),
        y1: get(line, 'points.y1'),
        x2: get(line, 'points.x2'),
        y2: get(line, 'points.y2')
      };

      // Swap values to ensure x1 < x2 and y1 < y2. Makes the collision check simpiler.
      if (p.x1 > p.x2) {
        [ p.x1, p.x2 ] = [ p.x2, p.x1 ];
      }

      if (p.y1 > p.y2) {
        [ p.y1, p.y2 ] = [ p.y2, p.y1 ];
      }

      // Logic here assumes horizontal or vertical lines
      const xOk = (p.x1 - x < tolerance && x - p.x2 < tolerance);
      const yOk = (p.y1 - y < tolerance && y - p.y2 < tolerance);

      if (xOk && yOk) {
        this.sendAction('select', line);
        break;
      }
    }
  },

  actions: {
    clear() {
      this.sendAction('clear');
    }
  }
});
