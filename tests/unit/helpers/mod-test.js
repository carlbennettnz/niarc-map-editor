/* jshint expr:true */
import { expect } from 'chai';
import {
  describe,
  it
} from 'mocha';
import {
  mod
} from 'niarc-map-editor/helpers/mod';

describe('ModHelper', function() {
  // Replace this with your real tests.
  it('works', function() {
    let result = mod(42);
    expect(result).to.be.ok;
  });
});
