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

  hasPreviousEvent: computed('connection.events.[]', 'selectedEvent', function() {
    const selectedEvents = get(this, 'selectedEvents');
    const events = get(this, 'connection.events') || [];

    return selectedEvents.length === 1 && events.indexOf(selectedEvents[0]) > 0;
  }),

  hasNextEvent: computed('connection.events.[]', 'selectedEvents', function() {
    const selectedEvents = get(this, 'selectedEvents');
    const events = get(this, 'connection.events') || [];
    const index = events.indexOf(selectedEvents[0]);

    return selectedEvents.length === 1 && index > -1 && index < events.length - 1;
  }),

  path: computed('connection.events.[]', function() {
    const events = get(this, 'connection.events') || [];
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
      const events = get(this, 'connection.events');

      const event = Event.create({
        type: 'go-to-point',
        x: get(point, 'x'),
        y: get(point, 'y')
      });

      events.pushObject(event);

      this.send('saveModel')
    },

    addEvent(type = 'drop-cube') {
      const newEvent = Event.create({ type });
      const events = get(this, 'connection.events');
      const selectedEvent = get(this, 'selectedEvents.lastObject');
      let index = events.length;

      if (selectedEvent) {
        index = events.indexOf(selectedEvent) + 1;
      }

      events.splice(index, 0, newEvent);
      events.arrayContentDidChange();

      set(this, 'selectedEvent', newEvent)

      this.send('saveModel');
    },

    deleteEvent() {
      const selectedEvents = get(this, 'selectedEvents') || [];
      const events = get(this, 'connection.events');
      let indexToSelect = null;

      if (!selectedEvents.length) {
        return;
      }

      if (selectedEvents.length === 1) {
        indexToSelect = Math.max(events.indexOf(selectedEvents[0]) - 1, 0);
      }

      events.removeObjects(selectedEvents);

      const remainingPointEvents = events.filterBy('type', 'go-to-point');

      if (remainingPointEvents.length === 1) {
        events.removeObjects(remainingPointEvents);
      }

      if (indexToSelect == null || events.length === 0) {
        set(this, 'selectedEvents', []);
      } else {
        set(this, 'selectedEvents', [ events.objectAt(indexToSelect) ]);
      }

      this.send('saveModel');
    },

    selectEvent(eventId) {
      const events = get(this, 'connection.events');
      const event = events.findBy('id', eventId);

      set(this, 'selectedEvents', event ? [ event ] : []);
    },

    selectPreviousEvent() {
      const selectedEvent = get(this, 'selectedEvent');

      if (!selectedEvent) {
        return;
      }

      const events = get(this, 'connection.events');
      const index = events.indexOf(selectedEvent);

      set(this, 'selectedEvent', events.objectAt(index - 1) || get(events, 'firstObject') || null);
    },

    selectNextEvent() {
      const selectedEvent = get(this, 'selectedEvent');

      if (!selectedEvent) {
        return;
      }

      const events = get(this, 'connection.events');
      const index = events.indexOf(selectedEvent);

      set(this, 'selectedEvent', events.objectAt(index + 1) || get(events, 'lastObject') || null);
    },

    addEventsToSelection(eventIds) {
      const events = get(this, 'connection.events');
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
      const events = get(this, 'connection.events') || [];
      const event = events.findBy('id', eventId);

      set(this, 'highlightedEvent', event);
    },

    updateEvents() {
      const path = get(this, 'path') || {};
      const points = get(path, 'points') || [];
      const events = get(this, 'connection.events');
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
    },

    connect() {
      const connection = get(this, 'connection');
      connection.connect();
    },

    disconnect() {
      const connection = get(this, 'connection');
      connection.disconnect();
    }
  }
});
