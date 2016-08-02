import Ember from 'ember';
import { expect } from 'chai';
import { describeModule, it } from 'ember-mocha';

const {
  get,
  set,
  assign
} = Ember;

const lines = [
  { points: { x1: 10, y1: 10, x2: 100, y2: 10 }, layer: 'map', isSelected: false },
  { points: { x1: 10, y1: 20, x2: 100, y2: 20 }, layer: 'map', isSelected: false }
];

describeModule('controller:map', 'MapController', {}, function() {
  describe('Adding lines', function() {
    it('can add lines to array model', function() {
      const controller = this.subject();

      controller.set('model', []);
      controller.send('addLine', lines[0]);

      expect(controller.get('model')).to.have.length(1);
    });

    it('can add lines to a null model', function() {
      const controller = this.subject();

      controller.set('model', null);
      controller.send('addLine', lines[0]);

      expect(controller.get('model')).to.have.length(1);
    });

    it('throws on invalid input', function() {
      const controller = this.subject();

      const points = { x1: 0, y1: 0, x2: 0, y2: 0 };
      const isSelected = false;
      const layer = 'map';

      expect(() => controller.send('addLine', null)).to.throw('Line must be provided');
      expect(() => controller.send('addLine', { isSelected, layer })).to.throw('Line must have points');
      expect(() => controller.send('addLine', { points, isSelected })).to.throw('Line must have a layer');
      expect(() => controller.send('addLine', { points, layer })).to.throw('Line must have an isSelected flag');
    })
  });

  describe('Selecting lines', function() {
    it('can select a line', function() {
      const controller = this.subject();

      controller.set('model', lines);
      controller.send('selectLine', lines[1]);

      expect(controller.get('model.1.isSelected')).to.equal(true);
    });

    it('can deselect all lines', function() {
      const controller = this.subject();

      controller.set('model', lines);
      controller.send('deselectAll');

      expect(controller.get('model.0.isSelected')).to.equal(false);
      expect(controller.get('model.1.isSelected')).to.equal(false);
    });
  });

  describe('Resizing lines', function() {
    it('can resize a line', function() {
      const controller = this.subject();

      controller.set('model', lines);
      controller.send('resizeLine', lines[0], {
        x1: 40,
        y1: 80,
        x2: 80,
        y2: 80
      });

      expect(controller.get('model.0.points.x1')).to.equal(40);
      expect(controller.get('model.0.points.y1')).to.equal(80);
      expect(controller.get('model.0.points.x2')).to.equal(80);
      expect(controller.get('model.0.points.y2')).to.equal(80);
    });

    it('does not care about grid snapping', function() {
      const controller = this.subject();

      controller.set('model', lines);
      controller.send('resizeLine', lines[0], {
        x1: 44,
        y1: 32,
        x2: 99,
        y2: -60
      });

      expect(controller.get('model.0.points.x1')).to.equal(44);
      expect(controller.get('model.0.points.y1')).to.equal(32);
      expect(controller.get('model.0.points.x2')).to.equal(99);
      expect(controller.get('model.0.points.y2')).to.equal(-60);
    });
  });

  describe('Removing lines', function() {
    it('can remove a single line', function() {
      const controller = this.subject();

      controller.set('model', assign([], lines));
      controller.send('removeLines', lines[0]);

      expect(controller.get('model')).to.have.length(1);
      expect(controller.get('model.0')).to.deep.equal(lines[1]);
    });

    it('can remove multiple lines', function() {
      const controller = this.subject();

      controller.set('model', assign([], lines));
      controller.send('removeLines', lines);

      expect(controller.get('model')).to.have.length(0);
    });
  });

  it.skip('saves the model when new lines are added (needs localstorage mock)');
});
