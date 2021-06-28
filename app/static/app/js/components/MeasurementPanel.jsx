import React from 'react';
import '../css/MapPanel.scss';
import PropTypes from 'prop-types';
import $ from 'jquery';
import Utils from '../classes/Utils';
import SaveMeasurementDialog from './SaveMeasurementDialog';
import {_} from "../classes/gettext";
import MapPanel from "./MapPanel";


class MeasurementPanel extends React.Component {
    static propTypes = {
        measurementUpdated: PropTypes.func,
        map: PropTypes.object.isRequired,
        enable: PropTypes.bool
    };
     constructor(props) {
         super(props);

         this.state = {
             loading: true,
             map: null,
             enable: false,
             startMeasuring: false,
             measurementFeatures: [],
             mode: ''
         };

         this.addMeasurement = this.addMeasurement.bind(this);
         this.add2DMeasurement = this.add2DMeasurement.bind(this);
         this.exportMeasurement = this.exportMeasurement.bind(this);
         this.export2DMeasurement = this.export2DMeasurement.bind(this);
         this.cancelMeasurement = this.cancelMeasurement.bind(this);
         this.cancel2DMeasurement = this.cancel2DMeasurement.bind(this);
         this.uploadMeasurement = this.uploadMeasurement.bind(this);
         this.saveMeasurement = this.saveMeasurement.bind(this);
         this.getMeasurementFeatures = this.getMeasurementFeatures.bind(this);

     }

    componentDidMount() {
         if (this.props.map && this.state.loading) {
             this.setState({
                 loading: false,
                 map: this.props.map,
                 mode: '2d'
             })
         }
    }

    componentDidUpdate() {
         if (this.props.map && this.state.loading) {
             this.setState({
                 loading: false,
                 map: this.props.map,
                 mode: '2d'
             })

             this.props.map.on('volumeCalculated', ({popupContainer, model, resultFeature}) => {
                this.setState({
                    startMeasuring: false
                })
                 setTimeout(() => {
                     this.getMeasurementFeatures()
                 }, 100)
             });
         }
    }

    add2DMeasurement() {
         $('.js-start')[0].click()
    }

    getMeasurementFeatures(){
        const features = [];
        const layers = [];
        this.state.map.eachLayer(layer => {
            const mp = layer._measurePopup;
            if (mp) {
                layers.push(layer)
                features.push(mp.getGeoJSON());
            }
        });
        this.setState({
            measurementFeatures: features
        })
        this.props.measurementUpdated(layers)
        return features
    }

    export2DMeasurement() {
        if (this.state.measurementFeatures.length > 0) {
            const geoJSON = {
                type: "FeatureCollection",
                features: this.state.measurementFeatures
            };
            Utils.saveAs(JSON.stringify(geoJSON, null, 4), "measurements.geojson")
        } else {
            alert("No new measurements")
        }
    }

    cancel2DMeasurement() {
         $('.js-cancel')[0].click()
    }

    addMeasurement() {
         this.setState({
             startMeasuring: true
         })
         if (this.state.mode === '2d') {
             this.add2DMeasurement()
         }
    }

    exportMeasurement() {
         if (this.state.mode === '2d') {
             this.export2DMeasurement()
         }
    }

    _createMeasurementFile(filename) {
         const geoJSON = {
            type: "FeatureCollection",
            features: this.state.measurementFeatures
        };
        let parts = [new Blob([JSON.stringify(geoJSON, null, 4)], {type: "text/plain;charset=utf-8"})];
        return new File(parts, `${filename}.geojson`, {type: "text/plain;charset=utf-8", lastModified: new Date()[0]})
    }

    saveMeasurement() {
        if (this.state.measurementFeatures.length > 0) {
            this.projectDialog.show()
        } else {
            alert("No new measurements")
        }
    }

    uploadMeasurement(measurement) {
        if (!measurement.name) return (new $.Deferred()).reject(_("Name field is required"));
        let fd = new FormData();
        fd.append('file', this._createMeasurementFile(measurement.name));
        fd.append('label', measurement.name);
        fd.append('data', '{}');
        fd.append('type', 'volume');
        return $.ajax({
            url: `/user-measurement/`,
            type: 'PUT',
            data: fd,
            processData: false,
            contentType: false,
        }).done(() => {
            alert('done')
        });
    }

    cancelMeasurement() {
         this.setState({
             startMeasuring: false
         })
         this.cancel2DMeasurement()
    }

    render() {
        return (
            <div>
                <SaveMeasurementDialog
                    saveAction={this.uploadMeasurement}
                    ref={(domNode) => { this.projectDialog = domNode; }}
                />
                <MapPanel title={"TOOLS"}>
                    <div id="accordion">
                        <div className="card">
                            <div className="card-header" id="headingOne">
                                {this.props.enable ?
                                    <div className="panelMenu"
                                         data-bs-toggle="collapse"
                                         data-bs-target="#collapseOne"
                                         aria-expanded="true"
                                         aria-controls="collapseOne">
                                        {this.state.loading ?
                                            <p>Loading...</p> :
                                            <p>Measure Volume</p>}
                                    </div> : null}
                            </div>
                            <div id="collapseOne" className="collapse"
                                 aria-labelledby="headingOne"
                                 data-parent="#accordion">
                                <div className="card-body" style={{ backgroundColor: "#294348" }}>
                                    <div className="btn-group" role="group"
                                         aria-label="Basic example">
                                        {!this.state.startMeasuring ?
                                            <button type="button"
                                                    className="btn btn-primary"
                                                    onClick={this.addMeasurement}>Add
                                            </button> :
                                            <button type="button"
                                                    className="btn btn-primary"
                                                    onClick={this.cancelMeasurement}>Cancel
                                            </button>
                                        }
                                        <button type="button"
                                                className="btn btn-primary" onClick={this.exportMeasurement}>Export
                                        </button>
                                        <button type="button"
                                                className="btn btn-primary" onClick={this.saveMeasurement}>Save
                                        </button>
                                        <button type="button"
                                                className="btn btn-primary">Load
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MapPanel>
            </div>
        );
    }
}

export default MeasurementPanel;
