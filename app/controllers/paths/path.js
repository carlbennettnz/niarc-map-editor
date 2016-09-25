import Ember from 'ember';
import ApplicationController from 'niarc-map-editor/controllers/application';
import Event, { parameters as eventParams } from 'niarc-map-editor/objects/event';
import Path from 'niarc-map-editor/objects/path';
import PathPoint from 'niarc-map-editor/objects/path-point';
import { EKMixin as EmberKeyboardMixin } from 'ember-keyboard';

const {
  get,
  set,
  run,
  computed,
  observer,
  assign,
  Object: EmberObject,
  inject: { service }
} = Ember;

export default ApplicationController.extend(EmberKeyboardMixin, {
  connection: service(),

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

  hasPreviousEvent: computed('model.events.[]', 'selectedEvents', function() {
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

  compiledEvent: computed(...eventParams.map(param => `selectedEvents.@each.${param}`), function() {
    const selectedEvents = get(this, 'selectedEvents');

    if (!selectedEvents.length)  {
      return null;
    }

    const type = get(selectedEvents[0], 'type');
    const compiledEvent = EmberObject.create({ type });
    const blankEvent = Event.create(); // Just used to get field types

    if (selectedEvents.rejectBy('type', type).length) {
      return null;
    }

    eventParams.forEach(key => {
      const firstValue = get(selectedEvents[0], key);
      const matchesFirst = selectedEvents.slice(1).map(event => get(event, key) !== firstValue);
      const type = get(blankEvent, key);

      // If they're all the same, show the value in the compiled event
      if (!matchesFirst.includes(true)) {
        set(compiledEvent, key, firstValue);
      }

      compiledEvent.addObserver(key, this, this.handleEventParamChange(type));
    });

    return compiledEvent;
  }),

  handleEventParamChange(type) {
    return function(sender, key) {
      let newValue = get(sender, key);
      const selectedEvents = get(this, 'selectedEvents');

      if (type === 'number' && !isNaN(newValue)) {
        newValue = Number(newValue);
      }

      selectedEvents.forEach(event => {
        set(event, key, newValue);
      });

      this.send('saveEvents');
    };
  },

  actions: {
    selectTool(tool) {
      set(this, 'tool', tool);
    },

    addPoint(point) {
      const events = get(this, 'model.events');

      const event = Event.create({
        type: 'go-to-point',
        x: get(point, 'x'),
        y: get(point, 'y')
      });

      events.pushObject(event);

      this.send('saveEvents');
    },

    addEvent(type) {
      const newEvent = Event.create({ type });
      const events = get(this, 'model.events');
      const selectedEvent = get(this, 'selectedEvents.lastObject');
      let index = events.length;
      let prevPoint;
      let nextPoint;

      if (selectedEvent) {
        index = events.indexOf(selectedEvent) + 1;
      }

      pointEvents
      set(newEvent, 'x', 0);
      set(newEvent, 'y', 0);

      events.splice(index, 0, newEvent);
      events.arrayContentDidChange();

      const pointEvents = events.filterBy('type', 'go-to-point');
      const newEventIndex = pointEvents.indexOf(newEvent);
      const prevEvent = newEventIndex > 0 ? pointEvents.objectAt(newEventIndex - 1) : null;
      const nextEvent = newEventIndex < pointEvents.length - 1 ? pointEvents.objectAt(newEventIndex + 1) : null;

      if (prevEvent && nextEvent) {
        set(newEvent, 'x', Math.round((get(prevEvent, 'x') + get(nextEvent, 'x')) / 2));
        set(newEvent, 'y', Math.round((get(prevEvent, 'y') + get(nextEvent, 'y')) / 2));
      } else {
        set(newEvent, 'x', 0);
        set(newEvent, 'y', 0);
      }

      set(this, 'selectedEvents', [ newEvent ]);

      this.send('saveEvents');
    },

    deleteEvent() {
      const selectedEvents = get(this, 'selectedEvents') || [];
      const events = get(this, 'model.events');
      let indexToSelect = null;

      if (!selectedEvents.length) {
        return;
      }

      if (selectedEvents.length === 1) {
        indexToSelect = Math.max(events.indexOf(selectedEvents[0]) - 1, 0);
      }

      events.removeObjects(selectedEvents);

      if (indexToSelect == null || events.length === 0) {
        set(this, 'selectedEvents', []);
      } else {
        set(this, 'selectedEvents', [ events.objectAt(indexToSelect) ]);
      }

      this.send('saveEvents');
    },

    selectEvent(eventId) {
      const events = get(this, 'model.events');
      const event = events.findBy('id', eventId);

      set(this, 'selectedEvents', event ? [ event ] : []);
    },

    toggleEventSelection(eventId) {
      const event = get(this, 'model.events').findBy('id', eventId);
      const selectedEvents = get(this, 'selectedEvents');

      if (selectedEvents.contains(event)) {
        selectedEvents.removeObject(event);
      } else {
        selectedEvents.pushObject(event);
      }
    },

    jumpEventSelection(step) {
      const selectedEvents = get(this, 'selectedEvents');

      if (selectedEvents.length !== 1) {
        return;
      }

      const events = get(this, 'model.events');
      const index = events.indexOf(selectedEvents[0]);
      const newSelection = events.objectAt(index + step) || get(events, step < 0 ? 'firstObject' : 'lastObject');

      set(this, 'selectedEvents', newSelection ? [ newSelection ] : []);
    },

    highlightEvent(eventId) {
      const events = get(this, 'model.events') || [];
      const event = events.findBy('id', eventId);

      set(this, 'highlightedEvent', event);
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

      this.send('saveEvents');
    },

    connect() {
      const connection = get(this, 'connection');
      connection.connect();

      connection.one('connected', () => {
        this.send('saveEvents');
      });
    },

    disconnect() {
      const connection = get(this, 'connection');
      connection.disconnect();
    }
  }
});
