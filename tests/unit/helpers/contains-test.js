/* jshint expr:true */
import { expect } from 'chai';
import {
  describe,
  it
} from 'mocha';
import {
  contains
} from 'niarc-map-editor/helpers/contains';

describe('ContainsHelper', function() {
  // Replace this with your real tests.
  it('works', function() {
    let result = contains(42);
    expect(result).to.be.ok;
  });
});
