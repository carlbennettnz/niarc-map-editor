/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'timeline-event',
  'Integration: TimelineEventComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#timeline-event}}
      //     template content
      //   {{/timeline-event}}
      // `);

      this.render(hbs`{{timeline-event}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
