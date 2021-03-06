import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('map');
  this.route('paths', function() {
    this.route('path', { path: ':id' });
    this.route('new');
  });
  this.route('not-found', { path: '*path' });
});

export default Router;
