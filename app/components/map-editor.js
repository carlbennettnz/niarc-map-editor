import Ember from 'ember';
import SvgEditorComponent from './svg-editor';
import { keyDown, getCode } from 'ember-keyboard';
import LineTool from 'niarc-map-editor/svg-editor-tools/line-tool';
import MoveTool from 'niarc-map-editor/svg-editor-tools/move-tool';
import SelectionTool from 'niarc-map-editor/svg-editor-tools/selection-tool';
import layout from 'niarc-map-editor/templates/components/svg-editor';

const {
  get,
  set,
  computed,
  on
} = Ember;

export default SvgEditorComponent.extend({
  layout,
  
  init() {
    this._super(...arguments);
    set(this, 'tools.line', LineTool.create({ editor: this }));
    set(this, 'tools.move', MoveTool.create({ editor: this }));
    set(this, 'tools.selection', SelectionTool.create({ editor: this }));
  },

  mouseDown({ clientX, clientY, crtlKey, metaKey, altKey, shiftKey, which }) {
    this._super(...arguments);

    const lineTool = get(this, 'tools.line');
    const moveTool = get(this, 'tools.move');
    const selectionTool = get(this, 'tools.selection');
    
    const action = get(this, 'action');
    const layerName = get(this, 'selectedLayerName');
    const point = this.getScaledAndOffsetPoint(clientX, clientY);
    const handles = lineTool.getLineHandlesAtPoint(point, { layerName });
    const lines = lineTool.getLinesAtPoint(point, { layerName });

    if (action) {
      return;
    }

    // Pan
    if ((which === 1 && (crtlKey || metaKey)) || which === 2) {
      moveTool.startMove({ x: clientX, y: clientY });
      set(this, 'action', 'pan');
      return;
    }

    // New lines
    if (altKey) {
      lineTool.startNewLine(point, shiftKey);
      set(this, 'action', 'newLine');
      return;
    }

    // Dragging on a handle
    if (handles.length) {
      lineTool.startMoveHandle(point, handles.findBy('shape.isSelected') || handles[0]);
      set(this, 'action', 'moveHandle');
      return;
    }

    // Dragging a line
    if (lines.length) {
      lineTool.startMoveLine(point, lines.findBy('isSelected') || lines[0]);
      set(this, 'action', 'moveLine');
      return;
    }

    // Selection
    if (true) {
      selectionTool.startSelection(point);
      set(this, 'action', 'select');
      return;
    }
  },

  mouseMove({ clientX, clientY, shiftKey, buttons }) {
    this._super(...arguments);

    const lineTool = get(this, 'tools.line');
    const moveTool = get(this, 'tools.move');
    const selectionTool = get(this, 'tools.selection');
    const action = get(this, 'action');
    const point = this.getScaledAndOffsetPoint(clientX, clientY);

    if (!buttons) {
      return;
    }

    switch (action) {
      case 'newLine':
        lineTool.adjustNewLine(point, shiftKey);
        break;

      case 'moveHandle':
        lineTool.moveHandle(point, shiftKey);
        break;

      case 'moveLine':
        lineTool.moveLine(point, shiftKey);
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
    const lineTool = get(this, 'tools.line');
    
    lineTool.deleteSelectedLine();
    event.preventDefault();
  }),

  arrowKey: on(keyDown('ArrowLeft'), keyDown('ArrowRight'), keyDown('ArrowUp'), keyDown('ArrowDown'), function(event) {
    const lineTool = get(this, 'tools.line');
    const keyCode = getCode(event);
    const map = {
      'ArrowLeft':  [ -1, 0 ],
      'ArrowUp':    [ 0, 1 ],
      'ArrowRight': [ 1, 0 ],
      'ArrowDown':  [ 0, -1 ]
    };

    lineTool.moveSelectedLineOnGrid(...map[keyCode]);
    event.preventDefault();
  }),

  escape: on(keyDown('Escape'), function(event) {
    const lineTool = get(this, 'tools.line');

    lineTool.deselectAllLines();
    event.preventDefault();
  }),

  shapes: computed.alias('lines')
});
