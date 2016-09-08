import Ember from 'ember';
import { keyDown, keyUp, getCode } from 'ember-keyboard';

const {
  get,
  set,
  on,
  $
} = Ember;

export default Ember.Mixin.create({
  arrowKeyScrollJump: 40,

  moveMouseDown: on('mouseDown', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    this.startMove({ x: event.clientX, y: event.clientY });
  }),

  moveMouseMove: on('mouseMove', function() {
    if (guard.apply(this, arguments)) {
      return;
    }

    if (!event.buttons) {
      set(this, 'toolState.mouseAction', null);
      return;
    }

    this.doMove({ x: event.clientX, y: event.clientY });
  }),

  moveMouseUp: on('mouseUp', function() {
    if (guard.apply(this, arguments)) {
      return;
    }

    this.endMove()
  }),

  moveArrowKeys: on(keyDown('ArrowLeft'), keyDown('ArrowRight'), keyDown('ArrowUp'), keyDown('ArrowDown'), function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    // If the user is focused on an input, don't hijack their key events
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    const code = getCode(event);
    const map = {
      'ArrowLeft':  [ 1, 0 ],
      'ArrowUp':    [ 0, -1 ],
      'ArrowRight': [ -1, 0 ],
      'ArrowDown':  [ 0, 1 ]
    };

    if (map[code]) {
      this.moveViewport(...map[code]);
      event.preventDefault();
    }
  }),

  selectMoveTool: on(keyUp('KeyM'), function() {
    set(this, 'tool', 'move');
  }),

  startMove(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    set(this, 'toolState.lastMousePos', point);
    $('body').addClass('grabbing');
  },

  doMove(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const last = get(this, 'toolState.lastMousePos');

    set(this, 'viewport.scrollX', get(this, 'viewport.scrollX') + (get(point, 'x') - get(last, 'x')));
    set(this, 'viewport.scrollY', get(this, 'viewport.scrollY') + (get(last, 'y') - get(point, 'y')));

    set(this, 'toolState.lastMousePos', point);
  },

  endMove() {
    if (guard.apply(this, arguments)) {
      return;
    }

    set(this, 'toolState.lastMousePos', null);
    $('body').removeClass('grabbing');
  },

  moveViewport(dx, dy) {
    set(this, 'viewport.scrollX', get(this, 'viewport.scrollX') + get(this, 'arrowKeyScrollJump') * dx);
    set(this, 'viewport.scrollY', get(this, 'viewport.scrollY') + get(this, 'arrowKeyScrollJump') * dy);
  }
});

function guard() {
  this._super(...arguments);
  return get(this, 'tool') !== 'move' || get(this, 'isDestroying');
}
