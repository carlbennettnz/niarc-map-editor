import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as geometry from 'niarc-map-editor/utils/geometry';

describe('GeometryUtil', function() {
  describe('checkPointCollision', function() {
    it('correctly identifies collisions', function() {
      const basePoint = { x: 50, y: 50 };
      const closePoint = { x: 55, y: 50 };
      const farPoint = { x: 70, y: 50 };
      const tolerance = 10;

      expect(geometry.checkPointCollision(basePoint, basePoint, tolerance)).to.equal(true);
      expect(geometry.checkPointCollision(basePoint, closePoint, tolerance)).to.equal(true);
      expect(geometry.checkPointCollision(basePoint, farPoint, tolerance)).to.equal(false);
    });

    it.skip('throws if given bad parameters');
  });

  describe('checkLineCollision', function() {
    it('correctly identifies collisions with normal lines', function() {
      const pointOnLine = { x: 50, y: 50 };
      const pointNearLine = { x: 60, y: 50 };
      const pointOffLine = { x: 70, y: 50 };
      const line = { x1: 0, y1: 0, x2: 100, y2: 100 };
      const tolerance = 10;

      expect(geometry.checkLineCollision(pointOnLine, line, tolerance)).to.equal(true);
      expect(geometry.checkLineCollision(pointNearLine, line, tolerance)).to.equal(true);
      expect(geometry.checkLineCollision(pointOffLine, line, tolerance)).to.equal(false);
    });

    it('correctly identifies collisions with lines going from top-right to bottom-left', function() {
      const pointOnLine = { x: 420, y: 100 };
      const pointNearLine = { x: 412, y: 100 };
      const pointOffLine = { x: 390, y: 100 };
      const line = { x1: 420, y1: 100, x2: 160, y2: 220 };
      const tolerance = 10;

      expect(geometry.checkLineCollision(pointOnLine, line, tolerance)).to.equal(true);
      expect(geometry.checkLineCollision(pointNearLine, line, tolerance)).to.equal(true);
      expect(geometry.checkLineCollision(pointOffLine, line, tolerance)).to.equal(false);
    });

    it.skip('throws if given bad parameters');
  });

  describe('pythagoras', function() {
    it('correctly calculates horizontal line lengths', function() {
      expect(geometry.pythagoras({ x1: 0, y1: 0, x2: 60, y2: 0 })).to.equal(60);
      expect(geometry.pythagoras({ x1: -10, y1: 60, x2: 60, y2: 60 })).to.equal(70);
    });

    it('correctly calculates vertical line lengths', function() {
      expect(geometry.pythagoras({ x1: 0, y1: 0, x2: 0, y2: 60 })).to.equal(60);
      expect(geometry.pythagoras({ x1: 60, y1: -10, x2: 60, y2: 60 })).to.equal(70);
    });

    it('correctly calculates diagonal line lengths', function() {
      expect(geometry.pythagoras({ x1: 0, y1: 0, x2: 30, y2: 40 })).to.equal(50);
      expect(geometry.pythagoras({ x1: -10, y1: 20, x2: 60, y2: 60 })).to.equal(Math.sqrt(70 * 70 + 40 * 40));
    });

    it.skip('throws if given bad parameters');
  });
});
