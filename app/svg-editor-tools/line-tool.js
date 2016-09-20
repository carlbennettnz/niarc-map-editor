import Ember from 'ember';
import { keyDown, getCode } from 'ember-keyboard';
import * as geometry from 'niarc-map-editor/utils/geometry';
import Line from 'niarc-map-editor/objects/line';

const {
  get,
  set,
  assign,
  on,
  Object: EmberObject
} = Ember;

export default EmberObject.extend({
  mouseDidDrag: false,

  deleteLine(keyCode, event) {
    // If the user is focused on an input, don't hijack their key events
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    if (keyCode === 'Delete') {
      editor.deleteSelectedLine();
      event.preventDefault();
    } else if (keyCode.startsWith('Arrow')) {
      const map = {
        'ArrowLeft':  [ -1, 0 ],
        'ArrowUp':    [ 0, -1 ],
        'ArrowRight': [ 1, 0 ],
        'ArrowDown':  [ 0, 1 ]
      };

      if (map[keyCode]) {
        this.moveSelectedLineOnGrid(...map[keyCode], event);
        event.preventDefault();
      }
    }
  },

  getLinesAtPoint(point, { layerName, selectedOnly } = {}) {
    const editor = get(this, 'editor');
    const shapes = get(editor, 'shapes');
    const tolerance = get(editor, 'clickToSelectTolerance');

    return shapes.filter(shape => {
      if (selectedOnly && !get(shape, 'isSelected')) {
        return false;
      }

      if (layerName && layerName !== get(shape, 'layer')) {
        return false;
      }

      const shapePoints = {
        x1: get(shape, 'points.x1'),
        y1: get(shape, 'points.y1'),
        x2: get(shape, 'points.x2'),
        y2: get(shape, 'points.y2')
      };

      return geometry.checkLineCollision(point, shapePoints, tolerance);
    });
  },

  getLineHandlesAtPoint(point, { layerName } = {}) {
    const editor = get(this, 'editor');
    const shapes = get(editor, 'shapes').filterBy('type', 'line');
    const tolerance = get(editor, 'clickToSelectTolerance');
    const found = [];

    shapes.forEach(shape => {
      if (layerName && get(shape, 'layer') !== layerName) {
        return;
      }

      const handles = [
        { x: get(shape, 'points.x1'), y: get(shape, 'points.y1') },
        { x: get(shape, 'points.x2'), y: get(shape, 'points.y2') }
      ];

      const collisions = handles.map(handle => geometry.checkPointCollision(point, handle, tolerance));

      if (collisions.contains(true)) {
        found.pushObject({
          handleIndex: collisions.indexOf(true) + 1,
          shape
        });
      }
    });

    return found;
  },

  startMoveHandle(point, handle) {
    const editor = get(this, 'editor');

    set(this, 'handleBeingMoved', handle);
    editor.sendAction('select', get(handle, 'shape'));
  },

  moveHandle(point, snapToGrid) {
    const editor = get(this, 'editor');
    const handleBeingMoved = get(this, 'handleBeingMoved');

    if (!handleBeingMoved) {
      return;
    }

    const { handleIndex, shape } = handleBeingMoved;

    // The point at the end of the line we're not moving
    const fixedPoint = {
      x: get(shape, `points.x${handleIndex % 2 + 1}`),
      y: get(shape, `points.y${handleIndex % 2 + 1}`)
    };

    if (snapToGrid) {
      point = editor.snapPointToGrid(point);
    }

    const newPoints = assign({}, get(shape, 'points'), {
      [`x${handleIndex}`]: get(point, 'x'),
      [`y${handleIndex}`]: get(point, 'y')
    });

    // Avoid giving the line zero length
    if (get(newPoints, 'x1') === get(newPoints, 'x2') && get(newPoints, 'y1') === get(newPoints, 'y2')) {
      return;
    }

    editor.sendAction('resize', shape, newPoints);
  },

  startMoveLine(point, line) {
    const editor = get(this, 'editor');

    set(this, 'lineBeingMoved', {
      line,
      initialMousePos: point,
      initialLinePos: assign({}, get(line, 'points'))
    });

    editor.sendAction('select', line);
  },

  moveLine(point, snapToGrid) {
    const editor = get(this, 'editor');
    const lineBeingMoved = get(this, 'lineBeingMoved');

    if (!lineBeingMoved) {
      return;
    }

    const { line, initialMousePos, initialLinePos } = lineBeingMoved;

    let delta = {
      x: point.x - initialMousePos.x,
      y: point.y - initialMousePos.y
    };

    if (snapToGrid) {
      delta = editor.snapPointToGrid(delta);
    }

    const newPos = {
      x1: get(initialLinePos, 'x1') + get(delta, 'x'),
      y1: get(initialLinePos, 'y1') + get(delta, 'y'),
      x2: get(initialLinePos, 'x2') + get(delta, 'x'),
      y2: get(initialLinePos, 'y2') + get(delta, 'y')
    };

    editor.sendAction('resize', line, newPos);
  },

  startNewLine(point, snapToGrid) {
    const editor = get(this, 'editor');
    const layer = get(editor, 'selectedLayerName');
    
    if (snapToGrid) {
      point = editor.snapPointToGrid(point);
    }

    editor.sendAction('deselectAll');

    set(this, 'newLine', Line.create({
      points: {
        x1: get(point, 'x'),
        y1: get(point, 'y'),
        x2: get(point, 'x'),
        y2: get(point, 'y')
      },
      isSelected: false,
      type: 'line',
      layer
    }));
  },

  adjustNewLine(point, snapToGrid) {
    const editor = get(this, 'editor');
    const newLine = get(this, 'newLine');
    const handleBeingMoved = get(this, 'handleBeingMoved');

    if (!newLine && handleBeingMoved) {
      return this.moveHandle(point, snapToGrid)
    }

    const point1 = {
      x: get(newLine, 'points.x1'),
      y: get(newLine, 'points.y1')
    };

    const point2 = editor.snapPointToGrid(point);

    // The line would still have zero length, don't do anything yet
    if (get(point1, 'x') === get(point2, 'x') && get(point1, 'y') === get(point2, 'y')) {
      return;
    }

    editor.sendAction('add', newLine);
    editor.sendAction('select', newLine);

    set(this, 'handleBeingMoved', {
      handleIndex: 2,
      shape: newLine
    });

    set(this, 'newLine', null);

    this.moveHandle(point);
  },

  moveSelectedLineOnGrid(dx, dy) {
    const editor = get(this, 'editor');
    const selected = get(editor, 'lines').findBy('isSelected');

    return this.moveLineOnGrid(selected, dx, dy);
  },

  moveLineOnGrid(line, dx, dy) {
    const editor = get(this, 'editor');
    const gridSize = get(editor, 'gridSize');

    if (line) {
      editor.sendAction('resize', line, {
        x1: get(line, 'points.x1') + dx * gridSize,
        y1: get(line, 'points.y1') + dy * gridSize,
        x2: get(line, 'points.x2') + dx * gridSize,
        y2: get(line, 'points.y2') + dy * gridSize,
      });
    }
  },

  deleteSelectedLine() {
    const editor = get(this, 'editor');
    const selected = get(editor, 'shapes').findBy('isSelected');

    if (selected) {
      editor.sendAction('remove', selected);
    }
  },

  deselectAllLines(){
    const editor = get(this, 'editor');

    editor.sendAction('deselectAll');
  }
});
