import Ember from 'ember';
import { keyDown, keyUp, getCode } from 'ember-keyboard';

const {
  get,
  set,
  on,
  $,
  Object: EmberObject
} = Ember;

export default EmberObject.extend({
  arrowKeyScrollJump: 40,

  startMove(point) {
    set(this, 'lastMousePos', point);
    $('body').addClass('grabbing');
  },

  move(point) {
    const editor = get(this, 'editor');
    const last = get(this, 'lastMousePos');

    set(editor, 'viewport.scrollX', get(editor, 'viewport.scrollX') + (get(point, 'x') - get(last, 'x')));
    set(editor, 'viewport.scrollY', get(editor, 'viewport.scrollY') + (get(last, 'y') - get(point, 'y')));

    set(this, 'lastMousePos', point);
  },

  endMove() {
    set(this, 'lastMousePos', null);
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
