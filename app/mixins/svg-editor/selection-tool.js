import Ember from 'ember';
import { keyUp } from 'ember-keyboard';
import min from 'niarc-map-editor/utils/computed/min';
import absoluteDifference from 'niarc-map-editor/utils/computed/absolute-difference';

const {
  get,
  set,
  on,
  Object: EmberObject
} = Ember;

export default Ember.Mixin.create({
  selectionMouseDown: on('mouseDown', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    set(this, 'toolState.mouseDidDrag', false);
    this.startSelection(point);
  }),

  selectionMouseMove: on('mouseMove', function() {
    if (guard.apply(this, arguments)) {
      return;
    }

    const mouseAction = get(this, 'toolState.mouseAction');
    const selection = get(this, 'toolState.selection');

    if (!event.buttons || !mouseAction) {
      set(this, 'toolState.mouseAction', null);
      return;
    }

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    set(this, 'toolState.mouseDidDrag', true);

    this.adjustSelection(point);
  }),

  selectionMouseUp: on('mouseUp', function() {
    if (guard.apply(this, arguments)) {
      return;
    }

    const didDrag = get(this, 'toolState.mouseDidDrag');

    if (didDrag) {
      console.log('finishing selection');
      this.finishSelection();
    }
  }),

  selectSelectionTool: on(keyUp('KeyS'), function() {
    set(this, 'tool', 'selection');
  }),

  startSelection(point) {
    set(this, 'toolState.mouseAction', 'drawingSelection');
    set(this, 'toolState.selection', EmberObject.extend({
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
  },

  adjustSelection(point) {
    set(this, 'toolState.selection.x2', get(point, 'x'));
    set(this, 'toolState.selection.y2', get(point, 'y'));
    set(this, 'toolState.selection.show', true);
  },

  finishSelection() {
    const path = get(this, 'path');
    const selection = get(this, 'toolState.selection');

    set(this, 'toolState.selection', null);
    set(this, 'toolState.mouseAction', null);

    if (path && selection) {
      const points = path.getPointsInRect(selection);

      this.sendAction('selectEvent', null);
      this.sendAction('addEventsToSelection', points.mapBy('id'));

      set(this, 'tool', 'path');
    }
  },
});

function guard() {
  this._super(...arguments);
  return get(this, 'tool') !== 'selection' || get(this, 'isDestroying');
}
