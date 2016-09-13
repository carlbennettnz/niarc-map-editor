import Ember from 'ember';

const {
  get,
  computed
} = Ember;

export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: [ 'isSelected:selected', 'isHighlighted:highlighted' ],
  attributeBindings: [ 'event.type:data-event-type' ],

  unknownEventType: computed('event.type', function() {
    const knownEventTypes = [
      'go-to-point',
      'drop-cube',
      'go-to-wall'
    ];

    return !knownEventTypes.includes(get(this, 'event.type'));
  }),

  click() {
    this.sendAction('selectEvent', get(this, 'event.id'));
  },

  mouseEnter() {
    this.sendAction('highlightEvent', get(this, 'event.id'));
  },

  mouseLeave() {
    this.sendAction('highlightEvent', null);
  }
});
