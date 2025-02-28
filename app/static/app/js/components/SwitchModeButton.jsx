import React from 'react';
import '../css/SwitchModeButton.scss';
import PropTypes from 'prop-types';
import { _ } from '../classes/gettext';

class SwitchModeButton extends React.Component {
  static defaultProps = {
    task: null,
    type: "mapToModel",
    public: false,
    style: {}
  };

  static propTypes = {
    task: PropTypes.object, // The object should contain two keys: {id: <taskId>, project: <projectId>}
    type: PropTypes.string, // Either "mapToModel" or "modelToMap"
    public: PropTypes.bool, // Whether to use public or private URLs
    style: PropTypes.object,
    url: PropTypes.string
  };

  constructor(props){
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.icon = this.icon.bind(this);
    this.text = this.text.bind(this);

  }

  handleClick(){
    if (this.props.url) {
      location.href = this.props.url;
      return;
    }
    if (this.props.task){
      const target = this.props.type === 'mapToModel' ? '3d' : 'map';

      let url = this.props.public ? 
                `../${target}/`
              : `/${target}/project/${this.props.task.project}/task/${this.props.task.id}/`;
      
      location.href = url;
    }
  }

  icon(){
    return this.props.type === 'mapToModel' ? 'fa-cube' : 'fa-globe';
  }

  text(){
    return this.props.type === 'mapToModel' ? _('3D') : _('2D');
  }

  render() {
    return (
      <button 
        style={this.props.style}
        onClick={this.handleClick}
        type="button"
        className={"switchModeButton btn btn-sm btn-secondary " + (!this.props.task ? "hide" : "")}>
        {this.text()}
      </button>
    );
  }
}

export default SwitchModeButton;
