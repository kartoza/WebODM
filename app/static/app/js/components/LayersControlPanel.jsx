import React from 'react';
import PropTypes from 'prop-types';
import '../css/LayersControlPanel.scss';
import LayersControlLayer from './LayersControlLayer';
import LayersMenuDropdown from "./LayersMenuDropdown";
import { _ } from '../classes/gettext';
import {ExpandButton} from "./Toggle";

export default class LayersControlPanel extends React.Component {
  static defaultProps = {
      layers: [],
      overlays: [],
      measurementLayers: [],
  };
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    layers: PropTypes.array.isRequired,
    measurementLayers: PropTypes.array,
    overlays: PropTypes.array,
    map: PropTypes.object.isRequired
  }

  constructor(props){
    super(props);
    this.state = {
      overlaysExpanded: true,
      measurementLayersExpanded: true,
      layersExpanded: true
    };
    this.deselectAllBaseLayers = this.deselectAllBaseLayers.bind(this);
  }

  deselectAllBaseLayers() {
    this.props.layers.forEach((layer, idx) => {
      this.props.map.removeLayer(layer);
    });
  }

  render(){
    let content = "";

    if (!this.props.layers.length) content = (<span></span>);
    else{
      content = (<div>
        <div>
          <div className="expand-button-container"><ExpandButton bind={[this, 'layersExpanded']} /><span style={{ marginTop: "auto", marginBottom: "auto" }}>Base Layers</span></div>
          {this.state.layersExpanded ?
            <div className="left-space">
              {this.props.layers.sort((a, b) => {
                  const m_a = a[Symbol.for("meta")] || {};
                  const m_b = b[Symbol.for("meta")] || {};
                  return m_a.name > m_b.name ? -1 : 1;
              }).map((layer, i) =>
                  <LayersControlLayer layerUpdated={this.deselectAllBaseLayers}
                                      radio={true}
                                      map={this.props.map}
                                      expanded={this.props.layers.length === 1}
                                      overlay={false}
                                      layer={layer}
                                      key={(layer[Symbol.for("meta")] || {}).name || i} />
              )}
            </div>
          : "" }
        </div>
        {this.props.overlays.length ?
            <div>
              <br/>
              <div  className="expand-button-container"><ExpandButton bind={[this, 'overlaysExpanded']} /><span style={{ marginTop: "auto", marginBottom: "auto" }}>Overlays</span></div>
              {this.state.overlaysExpanded ?
              <div className="overlays theme-border-primary left-space">
                  {this.props.overlays.map((layer, i) => <LayersControlLayer map={this.props.map} expanded={false} overlay={true} layer={layer} key={i} />)}
              </div> : ""}
            </div>
        : ""}
        {this.props.measurementLayers.length ?
            <div>
              <br/>
              <div  className="expand-button-container"><ExpandButton bind={[this, 'measurementLayersExpanded']} /><span style={{ marginTop: "auto", marginBottom: "auto" }}>Measurement Layers</span></div>
              {this.state.measurementLayersExpanded ?
              <div className="overlays theme-border-primary left-space">
                  {this.props.measurementLayers.map((layer, i) => <LayersControlLayer map={this.props.map} expanded={false} overlay={true} layer={layer} key={i} />)}
              </div> : ""}
          </div>
        : ""}
      </div>);
    }

    return (<div className="layers-control-panel">
      <span className="close-button" onClick={this.props.onClose}/>
      <LayersMenuDropdown title={_("Layers")}/>
      <hr/>
      {content}
    </div>);
  }
}
