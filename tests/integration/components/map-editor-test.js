import Ember from 'ember';
import { expect } from 'chai';
import { describeComponent, it } from 'ember-mocha';
import { beforeEach } from 'mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

const {
  get,
  set
} = Ember;

describeComponent('map-editor', 'Integration: MapEditorComponent', { integration: true }, function() {
  beforeEach(function() {
    this.set('lines', []);
    this.set('addLine', line => this.get('lines').pushObject(line));
    this.set('selectLine', line => set(line, 'isSelected', true));
    this.set('moveHandle', (handleIndex, line, point) => {
      set(line, `points.x${handleIndex}`, get(point, 'x'));
      set(line, `points.y${handleIndex}`, get(point, 'y'));
    });
  });

  it('renders the correct UI', function() {
    this.render(hbs`{{map-editor}}`);
    expect(this.$('button')).to.have.length(1);
    expect(this.$('svg')).to.have.length(1);
  });

  it('renders provided lines', function() {
    this.set('lines', [
      { points: { x1: 20, y1: 20, x2: 100, y2: 20 } },
      { points: { x1: 60, y1: 40, x2: 60, y2: 100 } }
    ]);

    this.render(hbs`{{map-editor lines=lines}}`);

    expect(this.$('g.wall')).to.have.length(2);

    const lines = [
      this.$('g.wall:first line'),
      this.$('g.wall:last line')
    ];

    expect(lines[0].attr('x1')).to.equal('20');
    expect(lines[0].attr('y1')).to.equal('20');
    expect(lines[0].attr('x2')).to.equal('100');
    expect(lines[0].attr('y2')).to.equal('20');

    expect(lines[1].attr('x1')).to.equal('60');
    expect(lines[1].attr('y1')).to.equal('40');
    expect(lines[1].attr('x2')).to.equal('60');
    expect(lines[1].attr('y2')).to.equal('100');
  });

  it('fires the clear action when the clear button is pressed', function(done) {
    this.set('clear', () => done());
    this.render(hbs`{{map-editor clear=clear}}`);
    this.$('button.clear').click();
  });

  it('adds a line when you click and drag', function() {
    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);

    this.$('svg')
      .trigger(mouseDownAt(20, 40))
      .trigger(mouseMoveAt(40, 40));

    return wait().then(() => {
      const wall = this.$('g.wall line');
      expect(wall).to.exist;
      expect(wall.attr('x1')).to.equal('20', 'x1');
      expect(wall.attr('y1')).to.equal('40', 'y1');
      expect(wall.attr('x2')).to.equal('40', 'x2');
      expect(wall.attr('y2')).to.equal('40', 'y2');
    });
  });

  it('sends a select action for the new line when it is created', function() {
    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);

    this.$('svg')
      .trigger(mouseDownAt(20, 40))
      .trigger(mouseMoveAt(40, 40));

    return wait().then(() => {
      expect(this.$('circle.handle')).to.have.length(2);
    });
  });

  it('sends add action on mouseup', function() {
    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);

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
    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);

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

  it('snaps to an axis', function() {
    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);

    this.$('svg')
      .trigger(mouseDownAt(20, 20))
      .trigger(mouseMoveAt(100, 80));

    return wait().then(() => {
      const wall = this.$('g.wall line');
      expect(wall).to.exist;
      expect(wall.attr('x1')).to.equal('20');
      expect(wall.attr('y1')).to.equal('20');
      expect(wall.attr('x2')).to.equal('100');
      expect(wall.attr('y2')).to.equal('20');

      const mouseMove2 = Ember.$.Event('mousemove');
      mouseMove2.offsetX = 60;
      mouseMove2.offsetY = 80;
      mouseMove2.buttons = 1;
      this.$('svg').trigger(mouseMove2);

      return wait();
    }).then(() => {
      const wall = this.$('g.wall line');
      expect(wall).to.exist;
      expect(wall.attr('x1')).to.equal('20');
      expect(wall.attr('y1')).to.equal('20');
      expect(wall.attr('x2')).to.equal('20');
      expect(wall.attr('y2')).to.equal('80');
    });
  });

  it('selects an existing line on click', function(done) {
    this.set('lines', [
      { points: { x1: 20, y1: 20, x2: 100, y2: 20 } },
      { points: { x1: 60, y1: 40, x2: 60, y2: 100 } }
    ]);

    this.set('selectLine', () => done());

    this.render(hbs`{{map-editor lines=lines select=selectLine}}`);

    const click = Ember.$.Event('click');
    click.offsetX = 20;
    click.offsetY = 20;
    this.$('svg').trigger(click);
  });

  it('shows handles on selected lines', function() {
    this.set('lines', [
      { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, isSelected: true },
      { points: { x1: 60, y1: 40, x2: 60, y2: 100 } }
    ]);

    this.render(hbs`{{map-editor lines=lines}}`);

    expect(this.$('circle.handle')).to.have.length(2);
  });

  it('edits the selected line when its handle is dragged', function() {
    this.set('lines', [
      { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, isSelected: true },
      { points: { x1: 60, y1: 40, x2: 60, y2: 100 } }
    ]);

    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);

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

  it('moves lines when clicked and dragged', function() {
    this.set('lines', [
      { points: { x1: 20, y1: 20, x2: 100, y2: 20 }, isSelected: true },
      { points: { x1: 60, y1: 40, x2: 60, y2: 100 } }
    ]);

    this.render(hbs`{{map-editor lines=lines add=addLine select=selectLine moveHandle=moveHandle}}`);


  });
});

function mouseClickAt(x, y) {
  return mouseEventAt('click', x, y);
}

function mouseDownAt(x, y) {
  return mouseEventAt('mousedown', x, y);
}

function mouseMoveAt(x, y) {
  const mouseMove = mouseEventAt('mousemove', x, y);

  mouseMove.buttons = 1;

  return mouseMove;
}

function mouseEventAt(eventName, x, y) {
  const event = Ember.$.Event(eventName);

  event.offsetX = x;
  event.offsetY = y;

  return event;
}
