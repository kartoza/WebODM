import React from "react";
import '../css/MapPanel.scss';
import PropTypes from 'prop-types';
import Storage from "../classes/Storage";
import update from "immutability-helper";
import MapPanel from "./MapPanel";


class RequestServicePanel extends React.Component {
    static propTypes = {
        workOrderTypeList: PropTypes.Array,
        user: PropTypes.object,
        map: PropTypes.object,
        serviceLayer: PropTypes.object,
        areaGeojson: PropTypes.object,
        areaDrawn: PropTypes.bool,
        specialInstructions: PropTypes.string
    };

    static defaultProps = {
        map: null,
        areaDrawn: false,
        areaGeojson: null,
        workOrderTypeList: [],
        specialInstructions: '',
        areaMethod: '',
        serviceLayer: null,
        selectedWorkOrder: {
            name: '',
            company: '',
            credit: '',
            id: '',
            area: ''
        }
    };

    constructor(props) {
        super(props);

        this.state = this.getInitialState(props);

        this.selectWorkOrder = this.selectWorkOrder.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleAreaBtn = this.handleAreaBtn.bind(this);
        this.drawInMap = this.drawInMap.bind(this);
        this.disableMapExtentEvents = this.disableMapExtentEvents.bind(this);
        this.enableMapExtentEvents = this.enableMapExtentEvents.bind(this);
        this.getMapExtent = this.getMapExtent.bind(this);
    }

    getInitialState = (props) => {
        return {
            selectedWorkOrder: props.selectedWorkOrder,
            user: JSON.parse(Storage.getItem('user')),
            specialInstructions: ''
        };
    }

    selectWorkOrder(workOrder) {
        this.setState({
            selectedWorkOrder: workOrder
        });
    }

    handleChange(field) {
        return (e) => {
            let state = {};
            state[field] = e.target.value;
            this.setState(state);
        }
    }

    handleAreaBtn(workOrderId, method) {
        this.setState(update(this.state, {
            areaMethod: {$set: method}
        }))
    }

    drawInMap() {
        if (!this.state.areaDrawn)
            document.querySelector('.leaflet-draw-draw-polygon').click();
    }

    clearDrawing() {
        const that = this;
        that.props.serviceLayer.eachLayer(function (layer) {
            that.props.serviceLayer.removeLayer(layer);
        });
        this.setState({
            areaDrawn: false,
            areaGeojson: {}
        })
    }

    disableMapExtentEvents() {
        this.props.map.off('zoomend', this.getMapExtent);
        this.props.map.off('dragend', this.getMapExtent);
    }

    enableMapExtentEvents() {
        this.props.map.on('zoomend', this.getMapExtent);
        this.props.map.on('dragend', this.getMapExtent);
    }

    getMapExtent() {
        let bounds = this.props.map.getBounds();
        let northWest = bounds.getNorthWest(),
            northEast = bounds.getNorthEast(),
            southWest = bounds.getSouthWest(),
            southEast = bounds.getSouthEast();
        const geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [northWest.lng, northWest.lat],
                            [northEast.lng, northEast.lat],
                            [southEast.lng, southEast.lat],
                            [southWest.lng, southWest.lat],
                            [northWest.lng, northWest.lat]
                        ]]
                    }
                }
            ]
        }
        this.setState({
            areaGeojson: geojson
        })
    }

    componentDidMount() {
        const that = this;
        if (that.props.map) {
             that.props.map.on(L.Draw.Event.CREATED, function (e) {
                 var type = e.layerType,
                     layer = e.layer;
                 that.props.serviceLayer.addLayer(layer);
                 that.setState({
                     areaDrawn: true,
                     areaGeojson: layer.toGeoJSON()
                 })
                 that.props.map.fitBounds(layer.getBounds());
             });
        }
    }


    render() {
        return (
            <div>
                <MapPanel title={"REQUEST A SERVICE"}>
                     <div id="serviceAccordion">
                        {this.props.workOrderTypeList.map((workOrder) => {
                            return (
                                <div key={workOrder.id} className="card" onClick={() => this.selectWorkOrder(workOrder)}>
                                    <div className={`card-header ${ this.state.selectedWorkOrder.id === workOrder.id ? "card-selected": ""}`} id="headingOne">
                                        <div className="panelMenu"
                                             data-bs-toggle="collapse"
                                             data-bs-target={`#service-${workOrder.id}`}
                                             aria-expanded="true"
                                             aria-controls={`#service${workOrder.id}`}>
                                            <p>{workOrder.name}</p>
                                        </div>
                                    </div>
                                    <div id={`service-${workOrder.id}`} className="collapse" data-bs-parent="#serviceAccordion">
                                        <div className="card-body" style={{ backgroundColor: "#294348" }}>
                                            <div className="mb-2 align-items-center">
                                                <p>{workOrder.description}</p>
                                            </div>
                                            <hr/>
                                            <div className="mb-2 align-items-center">
                                                <label
                                                    className="col-form-label control-label">Area {this.state.areaGeojson ? <span className="fas fa-redo clear-service-area" onClick={() => {
                                                        this.clearDrawing();
                                                        this.disableMapExtentEvents();
                                                        this.setState({
                                                            areaMethod: '',
                                                            areaGeojson: null,
                                                        })
                                                }}/> : ''}</label>
                                                <br/>
                                                <div className="btn-group"
                                                     role="group"
                                                     aria-label="Basic outlined example">
                                                    <button type="button"
                                                            onClick={() => {
                                                                this.handleAreaBtn(workOrder.id, 'draw');
                                                                this.drawInMap();
                                                                this.disableMapExtentEvents();
                                                            }}
                                                            className={`btn btn-outline-secondary ${this.state.areaMethod === 'draw' ? "btn-group-selected" : ""}`}>
                                                        Draw area
                                                    </button>
                                                    <button type="button"
                                                            onClick={() => {
                                                                this.handleAreaBtn(workOrder.id, 'extent');
                                                                this.clearDrawing();
                                                                this.getMapExtent();
                                                                this.enableMapExtentEvents();
                                                            }}
                                                            className={`btn btn-outline-secondary ${this.state.areaMethod === 'extent' ? "btn-group-selected" : ""}`}>
                                                        Use map extent
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-1 align-items-center">
                                                <label className="col-form-label control-label">Special Instructions</label>
                                                <input type="text" className="form-control" value={this.state.specialInstructions} onChange={this.handleChange('specialInstructions')}/>
                                            </div>
                                            <div className="mt-2" style={{ display: 'flex', flexDirection: "column" }}>
                                                <button className="btn btn-success btn-request btn-disabled" disabled={!this.state.areaGeojson}>Request</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </MapPanel>
            </div>
        );
    }
}

export default RequestServicePanel;
