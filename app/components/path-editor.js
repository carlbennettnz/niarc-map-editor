import Ember from 'ember';
import SvgEditorComponent from './svg-editor';
import PathToolMixin from 'niarc-map-editor/mixins/svg-editor/path-tool';
import layout from 'niarc-map-editor/templates/components/svg-editor';

const {
  get,
  set,
  computed
} = Ember;

export default SvgEditorComponent.extend(PathToolMixin, {
  layout,

  shapes: computed('map.[]', 'events.[]', function() {
    const map = get(this, 'map') || [];
    const events = get(this, 'events') || [];
    const shapes = [];

    shapes.push(...map);

    events.forEach(event => {
      if (get(event, 'type') === 'path') {
        shapes.push(event);
      }
    });

    return shapes;
  })
});
