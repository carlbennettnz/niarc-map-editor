import Ember from 'ember';
import { expect } from 'chai';
import { describeComponent, it } from 'ember-mocha';
import { beforeEach } from 'mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { getKeyCode } from 'ember-keyboard';
import Event from 'niarc-map-editor/objects/event';
import Path from 'niarc-map-editor/objects/path';
import PathPoint from 'niarc-map-editor/objects/path-point';

const {
  get,
  set,
  isArray,
  computed
} = Ember;

const componentWithAllArgs = hbs`{{path-editor
  tool=tool
  viewport=viewport
  layers=layers
  map=model.map
  path=path
  gridSize=20
  selectedEvents=selectedEvents
  highlightedEvent=highlightedEvent
  pathDidChange=(action updateEvents)
  addPoint=(action addPoint)
  selectPoint=(action selectEvent)
  addEventsToSelection=(action addEventsToSelection)
  highlightEvent=(action highlightEvent)
}}`;

describeComponent('path-editor', 'Integration: PathEditorComponent', { integration: true }, function() {
  beforeEach(function() {
    this.set('tool', 'path');
    this.set('viewport', { scrollX: 0, scrollY: 0, zoom: 1 });
    this.set('layers', [
      { name: 'map', isVisible: true, isSelected: false },
      { name: 'path', isVisible: true, isSelected: true },
    ]);

    this.set('map', []);
    this.set('updateEvents', _ => null);
    this.set('addPoint', point => this.get('events').pushObject(Event.create(point)));
    this.set('selectEvent', event => set(this, 'selectedEvents', [ event ]));
    this.set('addEventsToSelection', events => null);
    this.set('highlightEvent', event => null);

    this.set('events', []);

    this.set('path', computed('events.[]', function() {
      const events = get(this, 'events') || [];
      return events.length ? Path.create({ layer: 'path' }).fromEvents(events) : null;
    }));
  });

  describe('UI', function() {
    it('renders the correct UI', function() {
      this.render(componentWithAllArgs);
      expect(this.$('svg')).to.have.length(1);
    });

    it('renders provided lines', function() {
      this.set('path.points', [
        PathPoint.create({ event: { id: 0, x: 100, y: 100 } }),
        PathPoint.create({ event: { id: 0, x: 100, y: 300 } })
      ]);

      this.render(componentWithAllArgs);

      const $path = this.$('.path path.curved-path');

      expect($path).to.have.length(1);
      expect($path.attr('d')).to.equal('M 100,100 L 100,300');
    });

    it.skip('hides lines when layers are hidden', function() {
      this.get('layers').pushObject({
        name: 'path',
        isVisible: true,
        isSelected: false
      });

      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map' },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'path' }
      ]);

      this.render(componentWithAllArgs);
      expect(this.$('g.wall')).to.have.length(2, 'both lines rendered');

      this.set('layers.1.isVisible', false);
      expect(this.$('g.wall')).to.have.length(1, 'one line rendered');
    });

    it.skip('adds layer name class to lines and wrapping g', function() {
      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map' }
      ]);

      this.render(componentWithAllArgs);

      expect(this.$('g.scroll-offset').hasClass('map-layer-selected')).to.equal(true, 'g has map-layer-selected class');
      expect(this.$('g.wall').hasClass('map-layer')).to.equal(true, 'line has map-layer class');
    });

    it.skip('scales and zooms lines, axes, and the grid', function() {
      this.set('viewport.scrollX', 20);
      this.set('viewport.scrollY', 40);
      this.set('viewport.zoom', 0.5);

      this.set('path.points', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map' },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'map' }
      ]);

      this.render(componentWithAllArgs);

      // Lines

      const lines = [
        this.$('g.wall:first line'),
        this.$('g.wall:last line')
      ];

      expect(lines[0].attr('x1')).to.equal('10');
      expect(lines[0].attr('y1')).to.equal('10');
      expect(lines[0].attr('x2')).to.equal('50');
      expect(lines[0].attr('y2')).to.equal('10');

      expect(lines[1].attr('x1')).to.equal('30');
      expect(lines[1].attr('y1')).to.equal('20');
      expect(lines[1].attr('x2')).to.equal('30');
      expect(lines[1].attr('y2')).to.equal('50');

      // Axes

      expect(this.$('.axes.x').attr('y1')).to.equal('40', 'x axis');
      expect(this.$('.axes.y').attr('x1')).to.equal('20', 'y axis');

      // Grid

      expect(this.$('#grid-pattern').attr('x')).to.equal('20');
      expect(this.$('#grid-pattern').attr('y')).to.equal('40');
    });
  });

  describe('Adding new lines', function() {
    it.only('adds a line when you click and drag', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(0, 0))
        .trigger(mouseMoveAt(500, 0));

      return wait().then(() => {
        const $path = this.$('g.path .curved-path');
        expect($path).to.have.length(1);
        expect($path.attr('d')).to.match(/^M 0,\d+ L 500,\d+$/);
      });
    });

    it.only('continues to change the new line as it is dragged around', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(0, 0))
        .trigger(mouseMoveAt(500, 0));

      return wait().then(() => {
        const $path = this.$('g.path .curved-path');
        
        expect($path).to.have.length(1);
        expect($path.attr('d')).to.match(/^M 0,\d+ L 500,\d+$/);

        this.$('svg').trigger(mouseMoveAt(400, 0));

        return wait();
      }).then(() => {
        const $path = this.$('g.path .curved-path');
        
        expect($path).to.have.length(1);
        expect($path.attr('d')).to.match(/^M 0,\d+ L 500,\d+$/);
      });
    });

    it('sends a select action for the new line when it is created', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(20, 40))
        .trigger(mouseMoveAt(40, 40));

      return wait().then(() => {
        expect(this.$('circle.handle')).to.have.length(2);
      });
    });

    it('sends the correct actions to get the line added to the model', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(20, 40))
        .trigger(mouseMoveAt(100, 40));

      return wait().then(() => {
        const wall = this.$('g.wall line');
        expect(wall).to.exist;
        expect(wall.attr('x1')).to.equal('20');
        expect(wall.attr('y1')).to.equal('40');
        expect(wall.attr('x2')).to.equal('100');
        expect(wall.attr('y2')).to.equal('40');
      });
    });

    it('snaps to a 20px grid', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(25, 35))
        .trigger(mouseMoveAt(105, 45));

      return wait().then(() => {
        const wall = this.$('g.wall line');
        expect(wall).to.exist;
        expect(wall.attr('x1')).to.equal('20');
        expect(wall.attr('y1')).to.equal('40');
        expect(wall.attr('x2')).to.equal('100');
        expect(wall.attr('y2')).to.equal('40');
      });
    });

    it('never adds zero-length lines', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(20, 20))
        .trigger(mouseMoveAt(22, 22));

      return wait().then(() => {
        const wall = this.$('g.wall line');
        expect(wall).to.have.length(0, 'zero-length line was not created');

        this.$('svg').trigger(mouseMoveAt(35, 22));

        return wait();
      }).then(() => {
        const wall = this.$('g.wall line');
        expect(wall).to.have.length(1, 'line was created once it was long enough');
      });
    });

    it('never edits lines to make them zero-length', function() {
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(20, 20))
        .trigger(mouseMoveAt(40, 20));

      return wait().then(() => {
        const wall = this.$('g.wall line');
        expect(wall).to.have.length(1, 'created the wall');

        expect(wall.attr('x1')).to.equal('20', 'post-creation x1');
        expect(wall.attr('y1')).to.equal('20', 'post-creation y1');
        expect(wall.attr('x2')).to.equal('40', 'post-creation x2');
        expect(wall.attr('y2')).to.equal('20', 'post-creation y2');

        this.$('svg').trigger(mouseMoveAt(20, 20));

        return wait();
      }).then(() => {
        const wall = this.$('g.wall line');
        expect(wall).to.have.length(1, 'wall still exists');

        expect(wall.attr('x1')).to.equal('20', 'post-edit x1');
        expect(wall.attr('y1')).to.equal('20', 'post-edit y1');
        expect(wall.attr('x2')).to.equal('40', 'post-edit x2');
        expect(wall.attr('y2')).to.equal('20', 'post-edit y2');
      });
    });
  });

  describe('Selections', function() {
    it('selects an existing line on mouseup', function(done) {
      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map' },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'map' }
      ]);

      this.set('selectLine', () => done());

      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(20, 20))
        .trigger(mouseUpAt(20, 20));
    });

    it('selects an existing diagonal line on mouseup', function(done) {
      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 100 }, layer: 'map' },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'map' }
      ]);

      this.set('selectLine', () => done());

      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(50, 50))
        .trigger(mouseUpAt(50, 50));
    });

    it('selects an existing diagonal reversed line on mouseup', function(done) {
      this.set('lines', [ { points: { x1: 100, y1: 0, x2: 0, y2: 100 }, layer: 'map' } ]);
      this.set('selectLine', () => done());

      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(50, 50))
        .trigger(mouseUpAt(50, 50));
    });

    it('deselects everything on mousedown in empty area', function() {
      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 100 }, layer: 'map', isSelected: true },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'map' }
      ]);

      this.render(componentWithAllArgs);

      this.$('svg').trigger(mouseDownAt(70, 40));

      return wait().then(() => {
        expect(this.$('g.wall.selected').toArray()).to.have.length(0);
      });
    });

    it('does not select lines on unselected layers', function() {
      this.get('layers').pushObject({
        name: 'path',
        isVisible: true,
        isSelected: false
      });

      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map' },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'path' }
      ]);

      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(60, 40))
        .trigger(mouseUpAt(60, 40));

      return wait().then(() => {
        const selectedLines = this.get('lines').filterBy('isSelected');
        expect(selectedLines).to.have.length(0, 'none selected');
      });
    });

    it('shows handles on selected lines', function() {
      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map', isSelected: true },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'map' }
      ]);

      this.render(componentWithAllArgs);

      expect(this.$('circle.handle')).to.have.length(2);
    });
  });

  describe('Resizing', function() {
    it('edits the selected line when its handle is dragged', function() {
      this.set('lines', [
        { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map', isSelected: true },
        { points: { x1: 60, y1: 40, x2: 60, y2: 100 }, layer: 'map' }
      ]);

      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(20, 20))
        .trigger(mouseMoveAt(40, 20));

      return wait().then(() => {
        const wall = this.$('g.wall.selected line');
        expect(wall).to.exist;
        expect(wall.attr('x1')).to.equal('40', 'x1');
        expect(wall.attr('y1')).to.equal('20', 'y1');
        expect(wall.attr('x2')).to.equal('100', 'x2');
        expect(wall.attr('y2')).to.equal('20', 'y2');
      });
    });
  });

  describe('Moving', function() {
    it('moves a line when it is clicked and dragged', function() {
      this.set('lines', [ { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map', isSelected: true } ]);
      this.render(componentWithAllArgs);

      this.$('svg')
        .trigger(mouseDownAt(80, 20))
        .trigger(mouseMoveAt(80, 40));

      return wait().then(() => {
        const walls = this.$('g.wall');
        expect(walls.length).to.equal(1, 'still only one wall');
        const wall = walls.children('line:first');
        expect(wall).to.exist;
        expect(wall.attr('x1')).to.equal('20', 'x1');
        expect(wall.attr('y1')).to.equal('40', 'y1');
        expect(wall.attr('x2')).to.equal('100', 'x2');
        expect(wall.attr('y2')).to.equal('40', 'y2');
      });
    });

    it('moves the selected line when an arrow key is pressed', function() {
      this.set('lines', [ { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, layer: 'map', isSelected: true } ]);
      this.render(componentWithAllArgs);

      const codes = [ 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown' ];
      const expected = [
        [ 0, 20, 80, 20 ],
        [ 0, 0, 80, 0 ],
        [ 20, 0, 100, 0 ],
        [ 20, 20, 100, 20 ],
      ];

      const moveAndCheck = (code) => {
        this.$('svg').trigger(keyDownWith(code));

        return wait().then(() => {
          const wall = this.$('g.wall line');
          const e = expected.shift();

          expect(wall).to.exist;
          expect(wall.attr('x1')).to.equal(e[0].toString(), 'x1');
          expect(wall.attr('y1')).to.equal(e[1].toString(), 'y1');
          expect(wall.attr('x2')).to.equal(e[2].toString(), 'x2');
          expect(wall.attr('y2')).to.equal(e[3].toString(), 'y2');

          if (codes.length) {
            return moveAndCheck(codes.shift());
          }
        });
      };

      return moveAndCheck(codes.shift());
    });
  });
});

function mouseDownAt(x, y) {
  return mouseEventAt('mousedown', x, y);
}

function mouseMoveAt(x, y) {
  const mouseMove = mouseEventAt('mousemove', x, y);

  mouseMove.buttons = 1;

  return mouseMove;
}

function mouseUpAt(x, y) {
  return mouseEventAt('mouseup', x, y);
}

function mouseEventAt(eventName, x, y) {
  const event = Ember.$.Event(eventName);

  event.clientX = x;
  event.clientY = y;

  return event;
}

function keyDownWith(code) {
  const keyDown = Ember.$.Event('keydown');

  keyDown.keyCode = getKeyCode(code);
  keyDown.target = document.body;

  return keyDown;
}
