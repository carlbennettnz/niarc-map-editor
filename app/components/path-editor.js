import Ember from 'ember';
import SvgEditorComponent from './svg-editor';
// import PathToolMixin from 'niarc-map-editor/mixins/svg-editor/path-tool';
// import SelectionToolMixin from 'niarc-map-editor/mixins/svg-editor/selection-tool';
// import MoveToolMixin from 'niarc-map-editor/mixins/svg-editor/move-tool';
import layout from 'niarc-map-editor/templates/components/svg-editor';

const {
  get,
  set,
  on,
  computed
} = Ember;

export default SvgEditorComponent.extend(/* PathToolMixin, SelectionToolMixin, MoveToolMixin, */ {
  layout,

  tool: 'path',

  shapes: computed('map.[]', 'path', function() {
    const map = get(this, 'map');
    const path = get(this, 'path');
    const shapes = [];

    if (map) {
      shapes.push(...map);
    }

    if (path && get(path, 'points.length')) {
      shapes.push(path);
    }

    return shapes;
  })
});
