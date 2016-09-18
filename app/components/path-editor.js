import Ember from 'ember';
import SvgEditorComponent from './svg-editor';
import PathTool from 'niarc-map-editor/svg-editor-tools/path-tool';
import MoveTool from 'niarc-map-editor/svg-editor-tools/move-tool';
import SelectionTool from 'niarc-map-editor/svg-editor-tools/selection-tool';
import layout from 'niarc-map-editor/templates/components/svg-editor';
import { keyDown, getCode } from 'ember-keyboard';

const {
  get,
  set,
  on,
  computed
} = Ember;

export default SvgEditorComponent.extend({
  layout,

  init() {
    this._super(...arguments);
    set(this, 'tools.path', PathTool.create({ editor: this }));
    set(this, 'tools.move', MoveTool.create({ editor: this }));
    set(this, 'tools.selection', SelectionTool.create({ editor: this }));
  },

  mouseDown({ clientX, clientY, ctrlKey, metaKey, altKey, shiftKey, which }) {

    const pathTool = get(this, 'tools.path');
    const moveTool = get(this, 'tools.move');
    const selectionTool = get(this, 'tools.selection');

    const action = get(this, 'action');
    const layerName = get(this, 'selectedLayerName');
    const point = this.getScaledAndOffsetPoint(clientX, clientY);
    const handles = pathTool.getPathHandlesAtPoint(point);

    if (action) {
      return;
    }

    // Pan
    if ((which === 1 && (ctrlKey || metaKey) && !handles.length) || which === 2) {
      moveTool.startMove({ x: clientX, y: clientY });
      set(this, 'action', 'pan');
      return;
    }

    // New segments
    if (altKey) {
      pathTool.startNewLineSegment(point, shiftKey);
      set(this, 'action', 'moveHandle');
      return;
    }

    // Toggling handle selection
    if (handles.length && (ctrlKey || metaKey)) {
      this.sendAction('togglePointSelection', get(handles[0], 'id'));
      return;
    }

    // Dragging on a handle
    if (handles.length) {
      pathTool.startMoveHandle(point, handles.findBy('shape.isSelected') || handles[0]);
      set(this, 'action', 'moveHandle');
      return;
    }

    // Selection
    if (!shiftKey) {
      selectionTool.startSelection(point);
      set(this, 'action', 'select');
      return;
    }
  },

  mouseMove({ clientX, clientY, shiftKey, buttons }) {
    this._super(...arguments);

    const pathTool = get(this, 'tools.path');
    const moveTool = get(this, 'tools.move');
    const selectionTool = get(this, 'tools.selection');
    const action = get(this, 'action');
    const point = this.getScaledAndOffsetPoint(clientX, clientY);

    if (!buttons) {
      return;
    }

    switch (action) {
      case 'moveHandle':
        pathTool.moveHandle(point, shiftKey);
        break;

      case 'pan':
        moveTool.move({ x: clientX, y: clientY });
        break;

      case 'select':
        selectionTool.adjustSelection(point);
        break;
    }
  },

  mouseUp({ clientX, clientY }) {
    this._super(...arguments);

    const lineTool = get(this, 'tools.line');
    const moveTool = get(this, 'tools.move');
    const selectionTool = get(this, 'tools.selection');
    const action = get(this, 'action');
    const point = this.getScaledAndOffsetPoint(clientX, clientY);
    switch (action) {
      case 'pan':
        moveTool.endMove();
        break;

      case 'select':
        selectionTool.finishSelection();
        break;
    }

    set(this, 'action', null);
  },

  backspace: on(keyDown('Backspace'), function(event) {
    const pathTool = get(this, 'tools.path');
    
    pathTool.deleteSelectedHandles();
    event.preventDefault();
  }),

  arrowKey: on(keyDown('ArrowLeft'), keyDown('ArrowRight'), keyDown('ArrowUp'), keyDown('ArrowDown'), function(event) {
    const pathTool = get(this, 'tools.path');
    const keyCode = getCode(event);
    const map = {
      'ArrowLeft':  [ -1, 0 ],
      'ArrowUp':    [ 0, 1 ],
      'ArrowRight': [ 1, 0 ],
      'ArrowDown':  [ 0, -1 ]
    };

    pathTool.moveSelectedHandlesOnGrid(...map[keyCode]);
    event.preventDefault();
  }),

  ctrlA: on(keyDown('meta+KeyA'), keyDown('ctrl+KeyA'), function(event) {
    const pathTool = get(this, 'tools.path');

    pathTool.selectAllPoints();
    event.preventDefault();
  }),

  escape: on(keyDown('Escape'), function(event) {
    const pathTool = get(this, 'tools.path');

    pathTool.deselectAllPoints();
    event.preventDefault();
  }),

  shapes: computed('map.[]', 'path', function() {
    const map = get(this, 'map');
    const path = get(this, 'path');
    const shapes = [];

    if (map) {
      shapes.push(...map);
    }

    if (path && get(path, 'points.length')) {
      shapes.push(path);
    }

    return shapes;
  })
});
