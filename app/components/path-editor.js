import Ember from 'ember';
import SvgEditorComponent from './svg-editor';
import LineToolMixin from 'niarc-map-editor/mixins/svg-editor/line-tool';
import layout from 'niarc-map-editor/templates/components/svg-editor';

export default SvgEditorComponent.extend(LineToolMixin, {
  layout
});
