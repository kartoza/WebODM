import React from 'react'
import '../css/LayersControlPanel.scss';
import '../css/LayersControl3D.scss';
import PropTypes from 'prop-types';
import {ExpandButton} from "./Toggle";


class LayersControl3D extends React.Component {
    static defaultProps = {
        layers: [],
        selectedLayer: null
    };

    static propTypes = {
        layers: PropTypes.array,
        selectedLayerId: PropTypes.string,
        onLayerChanged: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            showLayers: false,
            baseLayersExpanded: true
        };
        this.clickControl = this.clickControl.bind(this);
        this.onLayersChanged = this.onLayersChanged.bind(this);
    }

    clickControl = () => {
        this.setState({
            showLayers: !this.state.showLayers
        })
    }

    onLayersChanged = (e) => {
        const selectedLayerId = $(e.target).val();
        const path = $(e.target).data('path');
        this.props.onLayerChanged(selectedLayerId, path)
    }

    render() {
        return (
            <div style={{
                position: "absolute",
                zIndex: 998,
                right: 0,
                padding: "0.8em"
            }}
                 className="map-3d-panel">
                <div className="layers-control-panel-3d"
                     onClick={() => this.clickControl()}
                     style={{display: this.state.showLayers ? 'none' : 'block'}}></div>
                {this.state.showLayers ?
                    <div className="layers-control-panel">
                        <span className="close-button"
                              onClick={() => this.clickControl()}></span>
                        <div className="title" style={{fontSize: '100%'}}>3D
                            Layers
                        </div>
                        <hr/>
                        <div className="expand-button-container"><ExpandButton
                            bind={[this, 'baseLayersExpanded']}/><span
                            style={{marginTop: "auto", marginBottom: "auto"}}>Base Layers</span>
                        </div>
                        {this.state.baseLayersExpanded ?
                            <div className="left-space">
                                {this.props.layers.map((layer, i) =>
                                    <div
                                        key={i}
                                        className="layers-control-layer form-check">
                                        <div className="overlayIcon">
                                            <i className="fas fa-cubes"></i>
                                        </div>
                                        <input className="form-check-input"
                                               type="radio"
                                               name="baseLayers"
                                               value={ layer.id }
                                               onChange={this.onLayersChanged}
                                               data-path={layer.path}
                                               id={ 'base-layer-' + layer.id }
                                               checked={this.props.selectedLayerId === layer.id}
                                        />
                                        <label className="form-check-label"
                                               htmlFor={ 'base-layer-' + layer.id }>
                                            {layer.name}
                                        </label>
                                    </div>)}
                            </div>
                            : ""}
                    </div>
                    : null
                }
            </div>
        );
    }
}

export default LayersControl3D;
