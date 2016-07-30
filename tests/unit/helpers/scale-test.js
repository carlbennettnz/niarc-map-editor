import { expect } from 'chai';
import { describe, it } from 'mocha';
import { scale } from 'niarc-map-editor/helpers/scale';

describe('ScaleHelper', function() {
  it('multiplies one number by the other', function() {
    expect(scale([ 3, 2 ])).to.equal(3 * 2);
    expect(scale([ Math.PI, 42 ])).to.equal(Math.PI * 42);
    expect(scale([ 0.001, 6 ])).to.equal(0.001 * 6);
  });

  it('throws if not given numbers', function() {
    const msg = 'Two numbers required';
    expect(() => scale()).to.throw(msg);
    expect(() => scale([ 1 ])).to.throw(msg);
    expect(() => scale([ null, 2 ])).to.throw(msg);
    expect(() => scale([ undefined, 3 ])).to.throw(msg);
  })
});
