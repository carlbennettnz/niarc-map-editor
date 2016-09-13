import Ember from 'ember';
import MapController from 'niarc-map-editor/controllers/map';
import Event from 'niarc-map-editor/objects/event';
import Path from 'niarc-map-editor/objects/path';
import PathPoint from 'niarc-map-editor/objects/path-point';

const {
  get,
  set,
  run,
  computed,
  observer,
  assign,
  inject: { service }
} = Ember;

export default MapController.extend({
  connection: service(),

  tool: 'path',

  layers: [{
    name: 'map',
    isVisible: true,
    isSelected: false
  }, {
    name: 'path',
    isVisible: true,
    isSelected: true
  }],

  selectedEvents: [],
  selectedPointEvents: computed('selectedEvents', {
    get() {
      const selectedEvents = get(this, 'selectedEvents') || [];
      return selectedEvents.filterBy('type', 'go-to-point');
    },

    set(key, value) {
      set(this, 'selectedEvents', value);
      return value;
    }
  }),

  highlightedEvent: null,

  watch: observer('model.events.[]', function() {
    console.log('ob', get(this, 'model.events.length'));
  }),

  hasPreviousEvent: computed('model.events.[]', 'selectedEvent', function() {
    const selectedEvents = get(this, 'selectedEvents');
    const events = get(this, 'model.events') || [];

    return selectedEvents.length === 1 && events.indexOf(selectedEvents[0]) > 0;
  }),

  hasNextEvent: computed('model.events.[]', 'selectedEvents', function() {
    const selectedEvents = get(this, 'selectedEvents');
    const events = get(this, 'model.events') || [];
    const index = events.indexOf(selectedEvents[0]);

    return selectedEvents.length === 1 && index > -1 && index < events.length - 1;
  }),

  path: computed('model.events.[]', function() {
    const events = get(this, 'model.events') || [];
    const goToPointEvents = events.filterBy('type', 'go-to-point');

    if (!goToPointEvents.length) {
      return null;
    }

    return Path.create({ layer: 'path' }).fromEvents(goToPointEvents);
  }),

  actions: {
    selectTool(tool) {
      set(this, 'tool', tool);
    },

    addPoint(point) {
      console.log('action: addPoint');
      const events = get(this, 'model.events');

      const event = Event.create({
        type: 'go-to-point',
        x: get(point, 'x'),
        y: get(point, 'y')
      });

      events.pushObject(event);

      // run.next(() => this.send('saveModel'));
    },

    addEvent(type = 'drop-cube') {
      console.log('action: addEvent');
      const newEvent = Event.create({ type });
      const events = get(this, 'model.events');
      const selectedEvent = get(this, 'selectedEvent');
      let index = 0;

      if (selectedEvent) {
        index = events.indexOf(selectedEvent) + 1;
      }

      events.splice(index + 1, 0, newEvent);
      set(this, 'selectedEvent', newEvent)

      // this.send('saveModel');
    },

    deleteEvent() {
      console.log('action: deleteEvent');
      const selectedEvent = get(this, 'selectedEvent');

      if (!selectedEvent) {
        return;
      }

      const events = get(this, 'model.events');
      const index = events.indexOf(selectedEvent);

      events.removeObject(selectedEvent);
      set(this, 'selectedEvent', events.objectAt(index) || get(events, 'lastObject') || null);

      this.send('saveModel');
    },

    selectEvent(eventId) {
      const events = get(this, 'model.events');
      const event = events.findBy('id', eventId);

      console.log(events.toArray());
      set(this, 'selectedEvents', event ? [ event ] : []);
    },

    selectPreviousEvent() {
      const selectedEvent = get(this, 'selectedEvent');

      if (!selectedEvent) {
        return;
      }

      const events = get(this, 'model.events');
      const index = events.indexOf(selectedEvent);

      set(this, 'selectedEvent', events.objectAt(index - 1) || get(events, 'firstObject') || null);
    },

    selectNextEvent() {
      const selectedEvent = get(this, 'selectedEvent');

      if (!selectedEvent) {
        return;
      }

      const events = get(this, 'model.events');
      const index = events.indexOf(selectedEvent);

      set(this, 'selectedEvent', events.objectAt(index + 1) || get(events, 'lastObject') || null);
    },

    addEventsToSelection(eventIds) {
      const events = get(this, 'model.events');
      const selectedEvents = get(this, 'selectedEvents');
      const newEvents = [ ...selectedEvents ];

      eventIds.forEach(id => {
        const event = events.findBy('id', id);

        if (!selectedEvents.includes(event)) {
          newEvents.pushObject(event);
        }
      });

      set(this, 'selectedEvents', newEvents);
    },

    highlightEvent(eventId) {
      const events = get(this, 'model.events');
      const event = events.findBy('id', eventId);

      set(this, 'highlightedEvent', event);
    },

    connect() {
      const connection = get(this, 'connection');
      connection.connect();
    },

    disconnect() {
      const connection = get(this, 'connection');
      connection.disconnect();
    },

    updateEvents() {
      const path = get(this, 'path') || {};
      const points = get(path, 'points') || [];
      const events = get(this, 'model.events');
      const eventsToRemove = [];

      const updatedEvents = events.map(event => {
        if (!event || get(event, 'type') !== 'go-to-point') {
          return;
        }

        const correspondingPoint = points.findBy('id', get(event, 'id'));

        if (!correspondingPoint) {
          eventsToRemove.unshift(event);
          return;
        }
        
        set(event, 'x', get(correspondingPoint, 'x'));
        set(event, 'y', get(correspondingPoint, 'y'));
      });

      events.removeObjects(eventsToRemove);

      this.send('saveModel');
    }
  }
});
