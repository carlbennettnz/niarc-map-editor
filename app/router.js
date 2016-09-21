import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('index', { path: '/' });
  this.route('map');
  this.route('path');
  this.route('config');
  this.route('select');
});

export default Router;
