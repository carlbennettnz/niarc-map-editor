import Ember from 'ember';

export default Ember.Component.extend({
  classNames: [ 'path-preview' ],

  click() {
    this.sendAction('click');
  }
});
