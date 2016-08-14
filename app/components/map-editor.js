import Ember from 'ember';
import SvgEditorComponent from './svg-editor';
import LineToolMixin from 'niarc-map-editor/mixins/svg-editor/line-tool';
import layout from 'niarc-map-editor/templates/components/svg-editor';

const {
  computed
} = Ember;

export default SvgEditorComponent.extend(LineToolMixin, {
  layout,

  shapes: computed.alias('lines')
});
