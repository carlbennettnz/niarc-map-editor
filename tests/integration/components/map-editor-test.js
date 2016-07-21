/* jshint expr:true */
import { expect } from 'chai';
import { describeComponent, it } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

describeComponent('map-editor', 'Integration: MapEditorComponent', { integration: true }, function() {
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
    this.render(hbs`{{map-editor}}`);

    const mouseDown = Ember.$.Event('mousedown');
    mouseDown.offsetX = 20;
    mouseDown.offsetY = 40;
    this.$('svg').trigger(mouseDown);

    const mouseMove = Ember.$.Event('mousemove');
    mouseMove.offsetX = 40;
    mouseMove.offsetY = 40;
    mouseMove.buttons = 1;
    this.$('svg').trigger(mouseMove);

    return wait().then(() => {
      const wall = this.$('g.wall line');
      expect(wall).to.exist;
      expect(wall.attr('x1')).to.equal('20');
      expect(wall.attr('y1')).to.equal('40');
      expect(wall.attr('x2')).to.equal('40');
      expect(wall.attr('y2')).to.equal('40');
    });
  });

  it('sends add action on mouseup', function(done) {
    this.set('addLine', () => done());

    this.render(hbs`{{map-editor add=addLine}}`);

    const mouseDown = Ember.$.Event('mousedown');
    mouseDown.offsetX = 25;
    mouseDown.offsetY = 35;
    this.$('svg').trigger(mouseDown);

    const mouseMove = Ember.$.Event('mousemove');
    mouseMove.offsetX = 105;
    mouseMove.offsetY = 45;
    mouseMove.buttons = 1;
    this.$('svg').trigger(mouseMove).trigger('mouseup');
  });
  it('snaps to a 20px grid', function() {
    this.render(hbs`{{map-editor}}`);

    const mouseDown = Ember.$.Event('mousedown');
    mouseDown.offsetX = 25;
    mouseDown.offsetY = 35;
    this.$('svg').trigger(mouseDown);

    const mouseMove = Ember.$.Event('mousemove');
    mouseMove.offsetX = 105;
    mouseMove.offsetY = 45;
    mouseMove.buttons = 1;
    this.$('svg').trigger(mouseMove);

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
    this.render(hbs`{{map-editor}}`);

    const mouseDown = Ember.$.Event('mousedown');
    mouseDown.offsetX = 20;
    mouseDown.offsetY = 20;
    this.$('svg').trigger(mouseDown);

    const mouseMove1 = Ember.$.Event('mousemove');
    mouseMove1.offsetX = 100;
    mouseMove1.offsetY = 80;
    mouseMove1.buttons = 1;
    this.$('svg').trigger(mouseMove1);

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
});
