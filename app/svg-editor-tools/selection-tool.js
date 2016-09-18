import Ember from 'ember';
import { keyUp } from 'ember-keyboard';
import min from 'niarc-map-editor/utils/computed/min';
import absoluteDifference from 'niarc-map-editor/utils/computed/absolute-difference';
import * as geometry from 'niarc-map-editor/utils/geometry';

console.log(geometry)

const {
  get,
  set,
  on,
  Object: EmberObject
} = Ember;

export default EmberObject.extend({
  startSelection(point) {
    const editor = get(this, 'editor');

    set(this, 'mouseDidDrag', false);

    set(editor, 'selection', EmberObject.extend({
      x1: get(point, 'x'),
      y1: get(point, 'y'),
      x2: null,
      y2: null,
      x: min('x1', 'x2'),
      y: min('y1', 'y2'),
      w: absoluteDifference('x1', 'x2'),
      h: absoluteDifference('y1', 'y2'),
      show: false
    }).create());

    console.log('started selection');
  },

  adjustSelection(point) {
    const editor = get(this, 'editor');
    
    set(editor, 'selection.x2', get(point, 'x'));
    set(editor, 'selection.y2', get(point, 'y'));
    set(editor, 'selection.show', true);

    console.log('adjusted selection');
  },

  finishSelection() {
    const editor = get(this, 'editor');
    const selection = get(editor, 'selection');
    const selectedLayerName = get(editor, 'selectedLayerName');

    const path = get(editor, 'path');
    const lines = get(editor, 'shapes')
      .filterBy('type', 'line')
      .filterBy('layer', selectedLayerName);

    set(editor, 'selection', null);

    if (!selection) {
      return;
    }

    lines
      .filter(line => geometry.lineIsInRect(selection, get(line, 'points')))
      .forEach(line => editor.sendAction('select', line));

    if (path && get(path, 'layer') === selectedLayerName) {
      const points = path.getPointsInRect(selection);

      editor.sendAction('selectEvent', null);
      editor.sendAction('addPointsToSelection', points.mapBy('id'));

      set(this, 'tool', 'path');
    }
  },
});
