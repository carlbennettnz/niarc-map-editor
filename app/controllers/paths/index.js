import Ember from 'ember';

const {
  get,
  set,
  assign,
  getProperties,
  computed
} = Ember;

export default Ember.Controller.extend({
  actions: {
    showInstructions(instructions) {
      this.transitionToRoute('paths.path', get(instructions, 'id'));
    }
  }
});
