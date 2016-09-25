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

    renameInstructions(instructions, name) {
      const data = get(this, 'data');

      const updatedInstructions = {
        name,
        id: get(instructions, 'id'),
        events: get(instructions, 'events'),
        modified: Date.now()
      };

      data.update('instructions', updatedInstructions);
    },

    duplicate(instructions) {
      const data = get(this, 'data');

      const clone = {
        name: get(instructions, 'name') + ' copy',
        events: get(instructions, 'events'),
        modified: Date.now()
      };

      data.create('instructions', clone).then(newId => {
        set(clone, 'id', newId);
        set(clone, 'path', get(instructions, 'path'));
        get(this, 'model').pushObject(clone);
      });
    },

    delete(instructions) {
      const data = get(this, 'data');

      data.delete('instructions', get(instructions, 'id')).then(() => {
        get(this, 'model').removeObject(instructions);
      });
    }
  }
});
