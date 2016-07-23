import Ember from 'ember';

const {
  get,
  set,
  assign
} = Ember;

export default Ember.Controller.extend({
  saveModel() {
    localStorage.map = JSON.stringify(get(this, 'model').map(line => {
      return assign({}, line, { isSelected: false });
    }));
  },

  actions: {
    addLine(line) {
      let model = get(this, 'model');

      if (!model) {
        model = set(this, 'model', []);
      }

      model.pushObject(line);
      this.saveModel();
    },

    selectLine(line) {
      this.send('deselectAll');
      set(line, 'isSelected', true);
    },

    deselectAll(line) {
      (get(this, 'model') || []).forEach(line => set(line, 'isSelected', false));
    },

    moveHandle(handleIndex, line, point) {
      set(line, `points.x${handleIndex}`, point.x);
      set(line, `points.y${handleIndex}`, point.y);
      this.saveModel();
    },

    clearLines() {
      set(this, 'model', []);
      this.saveModel();
    }
  }
});
