import Ember from 'ember';

const {
  get,
  set
} = Ember;

export default Ember.Controller.extend({
  saveModel: Ember.observer('model.[]', function() {
    localStorage.map = JSON.stringify(get(this, 'model'));
  }),

  actions: {
    addLine(line) {
      let model = get(this, 'model');

      if (!model) {
        model = set(this, 'model', []);
      }

      model.pushObject(line);
    },

    selectLine(line) {
      set(line, 'isSelected', true);
    }

    clearLines() {
      set(this, 'model', []);
    }
  }
});
