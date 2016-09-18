import Ember from 'ember';

const {
  get,
  computed
} = Ember;

export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: [ 'isSelected:selected', 'isHighlighted:highlighted' ],
  attributeBindings: [ 'event.type:data-event-type' ],

  click({ metaKey, ctrlKey }) {
    const selectedEvents = get(this, 'selectedEvents');

    if (metaKey || ctrlKey) {
      this.sendAction('toggleEventSelection', get(this, 'event.id'));
    } else {
      this.sendAction('selectEvent', get(this, 'event.id'));
    }
  },

  mouseEnter() {
    this.sendAction('highlightEvent', get(this, 'event.id'));
  },

  mouseLeave() {
    this.sendAction('highlightEvent', null);
  }
});
