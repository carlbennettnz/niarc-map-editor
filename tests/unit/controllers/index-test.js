import { expect } from 'chai';
import { describeModule, it } from 'ember-mocha';

const lines = [
  { points: { x1: 10, y1: 10, x2: 100, y2: 10 } },
  { points: { x1: 10, y1: 20, x2: 100, y2: 20 } }
];

describeModule('controller:index', 'IndexController', {}, function() {
  it('can add lines', function() {
    let controller = this.subject();
    expect(controller.get('model')).to.not.exist;
    controller.send('addLine', lines[0]);
    expect(controller.get('model')).to.have.length(1);
  });

  it('can clear lines', function() {
    let controller = this.subject();
    controller.set('model', lines);
    controller.send('removeLines', lines);
    expect(controller.get('model')).to.have.length(0);
  });

  it.skip('saves the model when new lines are added (needs localstorage mock)');
});
