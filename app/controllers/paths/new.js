import Ember from 'ember';

const {
  $,
  get,
  inject: { service }
} = Ember;

export default Ember.Controller.extend({
  data: service(),

  actions: {
    focus() {
      $('.new-path-form input').focus();
    },

    create(event) {
      const data = get(this, 'data');
      const name = get(this, 'name');

      data.create('instructions', {
        name,
        events: '',
        modified: Date.now()
      }).then(id => {
        this.transitionToRoute('paths.path', id);
      });

      return false;
    }
  }
});
