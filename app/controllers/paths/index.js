import Ember from 'ember';

const {
  get,
  set,
  assign,
  getProperties,
  computed,
  inject: { service }
} = Ember;

export default Ember.Controller.extend({
  data: service(),

  actions: {
    showInstructions(instructions) {
      this.transitionToRoute('paths.path', get(instructions, 'id'));
    },

    newInstructions() {
      this.transitionToRoute('paths.new');
    },

    rename() {
      alert('nah');
    },

    delete(instructions) {
      const data = get(this, 'data');

      data.delete('instructions', get(instructions, 'id')).then(() => {
        get(this, 'model').removeObject(instructions);
      });
    }
  }
});
