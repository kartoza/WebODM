import React from 'react';
import ReactDOM from 'ReactDOM';
import '../css/Map.scss';
import 'leaflet/dist/leaflet.css';
import Leaflet from 'leaflet';
import async from 'async';
import '../vendor/leaflet/L.Control.MousePosition.css';
import '../vendor/leaflet/L.Control.MousePosition';
import '../vendor/leaflet/Leaflet.Autolayers/css/leaflet.auto-layers.css';
import '../vendor/leaflet/Leaflet.Autolayers/leaflet-autolayers';
import "core-js/stable";
import "regenerator-runtime/runtime";
// import '../vendor/leaflet/L.TileLayer.NoGap';
import Dropzone from '../vendor/dropzone';
import $ from 'jquery';
import ErrorMessage from './ErrorMessage';
import ImagePopup from './ImagePopup';
import SwitchModeButton from './SwitchModeButton';
import ShareButton from './ShareButton';
import AssetDownloads from '../classes/AssetDownloads';
import {addTempLayer} from '../classes/TempLayer';
import PropTypes from 'prop-types';
import PluginsAPI from '../classes/plugins/API';
import Basemaps from '../classes/Basemaps';
import Standby from './Standby';
import LayersControl from './LayersControl';
import update from 'immutability-helper';
import Utils from '../classes/Utils';
import '../vendor/leaflet/Leaflet.Ajax';
import '../vendor/leaflet/Leaflet.Awesome-markers';
import { _ } from '../classes/gettext';
import MeasurementTable from "./MeasurementTable";
import MeasurementPanel from "./MeasurementPanel";
import RequestServicePanel from "./RequestServicePanel";
import UserLayers from "../classes/UserLayers";
import MapTools from "../classes/MapTools";

class Map extends React.Component {
  static defaultProps = {
    showBackground: false,
    mapType: "orthophoto",
    public: false,
    currentTool: MapTools.measurementTool
  };

  static propTypes = {
    showBackground: PropTypes.bool,
    tiles: PropTypes.array.isRequired,
    mapType: PropTypes.oneOf(['orthophoto', 'plant', 'dsm', 'dtm']),
    public: PropTypes.bool,
    currentTool: PropTypes.string
  };

  constructor(props) {
    super(props);
    
    this.state = {
      map: null,
      error: "",
      singleTask: null, // When this is set to a task, show a switch mode button to view the 3d model
      pluginActionButtons: [],
      showLoading: false, // for drag&drop of files and first load
      opacity: 100,
      imageryLayers: [],
      overlays: [],
      measurementData: [],
      measurementLayers: []
    };

    this.basemaps = {};
    this.mapBounds = null;
    this.autolayers = null;
    this.addedCameraShots = false;
    this.newMeasurementData = [];

    this.loadImageryLayers = this.loadImageryLayers.bind(this);
    this.updatePopupFor = this.updatePopupFor.bind(this);
    this.handleMapMouseDown = this.handleMapMouseDown.bind(this);
    this.loadMeasurementData = this.loadMeasurementData.bind(this);
    this.measurementUpdated = this.measurementUpdated.bind(this);
  }

  updateOpacity = (evt) => {
    this.setState({
      opacity: parseFloat(evt.target.value),
    });
  }

  updatePopupFor(layer){
    const popup = layer.getPopup();
    $('#layerOpacity', popup.getContent()).val(layer.options.opacity);
  }

  typeToHuman = (type) => {
      switch(type){
          case "orthophoto":
              return _("Orthophoto");
          case "plant":
              return _("Plant Health");
          case "dsm":
              return _("DSM");
          case "dtm":
              return _("DTM");
      }
      return "";
  }

  measurementUpdated(features) {
      for (let key in features) {
          const feature = features[key];
          const _id = feature._leaflet_id;
          if (this.newMeasurementData.includes(_id)) {
              continue
          }
          this.newMeasurementData.push(_id)
          const _label = `Measurement ${this.newMeasurementData.length}`;
          feature['feature'] = feature._measurePopup.getGeoJSON();
          feature[Symbol.for("meta")] = {name: _label};
          const _measurementData = feature._measurePopup.getProperties();
          _measurementData['name'] = _label;
          this.setState(update(this.state, {
              overlays: {$push: [feature]},
              measurementData: {$push: [_measurementData]}
          }));
      }
  }

  async loadUploadedLayers() {
      let layers = [];
      let icon = 'fa fa-draw-polygon fa-fw';
      let geoserverUrl = this.props.geoserverUrl;
      if (!geoserverUrl)
          return false;
      let userLayer = new UserLayers({}, geoserverUrl);
      try {
          layers = await userLayer.getUploaderLayers();
          await userLayer.getCapabilities();
      } catch (err) {
          console.log('Error retrieving user layers');
      }
      if (layers && layers.length > 0) {
          for (let i = 0; i < layers.length; i++) {
              const layer = layers[i];
              let wmsOptions = {
                  layers: layer.layer,
                  format: 'image/png',
                  transparent: true,
              }
              let wmsLayer = L.tileLayer.wms(geoserverUrl + '/gwc/service/wms', wmsOptions);
              wmsLayer[Symbol.for("meta")] = {name: layer.title, icon: icon};
              const bbox = userLayer.getBoundingBox(layer.layer);
              if (bbox)
                wmsLayer.options['bounds'] = userLayer.getBoundingBox(layer.layer);
              this.setState(update(this.state, {
                  overlays: {$push: [wmsLayer]}
              }));
          }
      }
  }

  loadMeasurementData() {
      const self = this;
      // Cancel previous requests
      if (this.measurementJsonRequests) {
          this.measurementJsonRequests.forEach(measurementJsonRequest => measurementJsonRequest.abort());
      }
      self.measurementJsonRequests = []
      return new Promise((resolve, reject) => {
            $.ajax({
                url: `/list-user-measurement/`,
                contentType: 'application/json',
                type: 'GET'
            }).done(async json => {
                if (json) {
                    for (let i = 0; i < json.length; i++) {
                        const measurementData = json[i];
                        const re = /(?:\.([^.]+))?$/;
                        const extension = re.exec(measurementData.measurement_data)[1];
                        if (extension === 'txt' || extension.includes('json')) {
                            self.measurementJsonRequests.push(await $.getJSON(measurementData.measurement_data, function(jsonMeasurementData) {
                                if (jsonMeasurementData.type === 'FeatureCollection') {
                                    if (!('crs' in jsonMeasurementData)) {
                                        jsonMeasurementData['crs'] = {
                                            "type": "name",
                                            "properties": {
                                                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                                            }
                                        }
                                    }
                                    const parts = [new Blob([JSON.stringify(jsonMeasurementData, null, 4)], {type: "application/json;charset=utf-8"})];
                                    const file = new File(parts, measurementData.label, {type: "application/json;charset=utf-8", lastModified: new Date()[0]});
                                    addTempLayer(file, (err, tempLayer, filename) => {
                                        if (typeof tempLayer === 'undefined') {
                                            return true;
                                        }

                                        if (!err) {
                                            tempLayer.addTo(self.map);
                                            tempLayer[Symbol.for("meta")] = {name: filename};
                                            for (const [key, value] of Object.entries(tempLayer._layers)) {
                                                const feature = value.feature;
                                                feature.properties['name'] = measurementData.label;
                                                feature.properties['color'] = value.options.color;
                                                self.setState(update(self.state, {
                                                    measurementData: {$push: [feature.properties]}
                                                }));
                                            }
                                            self.setState(update(self.state, {
                                                measurementLayers: {$push: [tempLayer]}
                                            }));
                                        } else {
                                            self.setState({error: err.message || JSON.stringify(err)});
                                        }
                                        self.setState({showLoading: false});
                                    });
                                }
                            }))
                        }
                    }
                    resolve()
                }
            }).fail(reject);
      })
  }

  async loadUserLayers() {
      await this.loadMeasurementData()
      await this.loadUploadedLayers()
  }

  loadImageryLayers(forceAddLayers = false){
    // Cancel previous requests
    if (this.tileJsonRequests) {
        this.tileJsonRequests.forEach(tileJsonRequest => tileJsonRequest.abort());
        this.tileJsonRequests = [];
    }

    const { tiles } = this.props,
          layerId = layer => {
            const meta = layer[Symbol.for("meta")];
            return meta.task.project + "_" + meta.task.id;
          };

    // Remove all previous imagery layers
    // and keep track of which ones were selected
    const prevSelectedLayers = [];

    this.state.imageryLayers.forEach(layer => {
      if (this.map.hasLayer(layer)) prevSelectedLayers.push(layerId(layer));
      layer.remove();
    });
    this.setState({imageryLayers: []});

    // Request new tiles
    return new Promise((resolve, reject) => {
      this.tileJsonRequests = [];

      async.each(tiles, (tile, done) => {
        const { url, meta, type } = tile;
        
        let metaUrl = url + "metadata";

        if (type == "plant") metaUrl += "?formula=NDVI&bands=RGN&color_map=rdylgn";
        if (type == "dsm" || type == "dtm") metaUrl += "?hillshade=6&color_map=jet";

        this.tileJsonRequests.push($.getJSON(metaUrl)
          .done(mres => {
            const { scheme, name, maxzoom, statistics } = mres;

            const bounds = Leaflet.latLngBounds(
                [mres.bounds.value.slice(0, 2).reverse(), mres.bounds.value.slice(2, 4).reverse()]
              );

            // Build URL
            let tileUrl = mres.tiles[0];
            
            // Set rescale
            if (statistics){
                const params = Utils.queryParams({search: tileUrl.slice(tileUrl.indexOf("?"))});
                if (statistics["1"]){
                    // Add rescale
                    params["rescale"] = encodeURIComponent(`${statistics["1"]["min"]},${statistics["1"]["max"]}`);              
                }else{
                    console.warn("Cannot find min/max statistics for dataset, setting to -1,1");
                    params["rescale"] = encodeURIComponent("-1,1");
                }
                tileUrl = Utils.buildUrlWithQuery(tileUrl, params);
            }

            const layer = Leaflet.tileLayer(tileUrl, {
                  bounds,
                  minZoom: 0,
                  maxZoom: maxzoom + 99,
                  maxNativeZoom: maxzoom,
                  tms: scheme === 'tms',
                  opacity: this.state.opacity / 100,
                  detectRetina: true
                });
            
            // Associate metadata with this layer
            meta.name = name + ` (${this.typeToHuman(type)})`;
            meta.metaUrl = metaUrl;
            layer[Symbol.for("meta")] = meta;
            layer[Symbol.for("tile-meta")] = mres;

            if (forceAddLayers || prevSelectedLayers.indexOf(layerId(layer)) !== -1){
              layer.addTo(this.map);
            }

            // Show 3D switch button only if we have a single orthophoto
            if (tiles.length === 1){
              this.setState({singleTask: meta.task});
            }

            // For some reason, getLatLng is not defined for tileLayer?
            // We need this function if other code calls layer.openPopup()
            let self = this;
            layer.getLatLng = function(){
              let latlng = self.lastClickedLatLng ? 
                            self.lastClickedLatLng : 
                            this.options.bounds.getCenter();
              return latlng;
            };

            var popup = L.DomUtil.create('div', 'infoWindow');

            popup.innerHTML = `<div class="title">
                                    ${name}
                                </div>
                                <div class="popup-opacity-slider">Opacity: <input id="layerOpacity" type="range" value="${layer.options.opacity}" min="0" max="1" step="0.01" /></div>
                                <div>Bounds: [${layer.options.bounds.toBBoxString().split(",").join(", ")}]</div>
                                <ul class="asset-links loading">
                                    <li><i class="fa fa-spin fa-sync fa-spin fa-fw"></i></li>
                                </ul>

                                <button
                                    onclick="location.href='/3d/project/${meta.task.project}/task/${meta.task.id}/';"
                                    type="button"
                                    class="switchModeButton btn btn-sm btn-secondary">
                                    <i class="fa fa-cube"></i> 3D
                                </button>`;

            layer.bindPopup(popup);

            $('#layerOpacity', popup).on('change input', function() {
                layer.setOpacity($('#layerOpacity', popup).val());
            });
            
            this.setState(update(this.state, {
                imageryLayers: {$push: [layer]}
            }));

            let mapBounds = this.mapBounds || Leaflet.latLngBounds();
            mapBounds.extend(bounds);
            this.mapBounds = mapBounds;

            // Add camera shots layer if available
            if (meta.task && meta.task.camera_shots && !this.addedCameraShots){
                const cameraMarker = L.AwesomeMarkers.icon({
                    icon: 'camera',
                    markerColor: 'blue',
                    prefix: 'fa'
                });

                const shotsLayer = new L.GeoJSON.AJAX(meta.task.camera_shots, {
                    style: function (feature) {
                      return {
                        opacity: 1,
                        fillOpacity: 0.7,
                        color: "#000000"
                      }
                    },
                    pointToLayer: function (feature, latlng) {
                      return L.marker(latlng, {
                        icon: cameraMarker
                      });
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.filename) {
                            let root = null;
                            const lazyrender = () => {
                                if (!root) root = document.createElement("div");
                                ReactDOM.render(<ImagePopup task={meta.task} feature={feature}/>, root);
                                return root;
                            }

                            layer.bindPopup(L.popup(
                                {
                                    lazyrender,
                                    maxHeight: 450,
                                    minWidth: 320
                                }));
                        }
                    }
                });
                shotsLayer[Symbol.for("meta")] = {name: name + " " + _("(Cameras)"), icon: "fa fa-camera fa-fw"};

                this.setState(update(this.state, {
                    overlays: {$push: [shotsLayer]}
                }));

                this.addedCameraShots = true;
            }

            done();
          })
          .fail((_, __, err) => done(err))
        );
      }, err => {
        if (err){
          if (err !== "abort"){
              this.setState({error: err.message || JSON.stringify(err)});
          }
          reject();
        }else resolve();
      });
    });
  }

  componentDidMount() {
    const { showBackground, tiles } = this.props;

    this.map = Leaflet.map(this.container, {
      scrollWheelZoom: true,
      positionControl: true,
      zoomControl: false,
      minZoom: 0,
      maxZoom: 24
    });

    this.props.onMapCreated(this.map)
    this.setState({map: this.map});

    // For some reason, in production this class is not added (but we need it)
    // leaflet bug?
    $(this.container).addClass("leaflet-touch");

    PluginsAPI.Map.triggerWillAddControls({
        map: this.map,
        tiles
    });

    let scaleControl = Leaflet.control.scale({
      maxWidth: 250,
    }).addTo(this.map);

    //add zoom control with your options
    let zoomControl = Leaflet.control.zoom({
         position:'bottomleft'
    }).addTo(this.map);

    if (showBackground) {
      this.basemaps = {};
      
      Basemaps.forEach((src, idx) => {
        const { url, ...props } = src;
        const tileProps = Utils.clone(props);
        tileProps.maxNativeZoom = tileProps.maxZoom;
        tileProps.maxZoom = tileProps.maxZoom + 99;
        const layer = L.tileLayer(url, tileProps);

        if (idx === 0) {
          layer.addTo(this.map);
        }

        this.basemaps[props.label] = layer;
      });

      const customLayer = L.layerGroup();
      customLayer.on("add", a => {
        let url = window.prompt([_('Enter a tile URL template. Valid coordinates are:'),
_('{z}, {x}, {y} for Z/X/Y tile scheme'),
_('{-y} for flipped TMS-style Y coordinates'),
'',
_('Example:'),
'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'].join("\n"), 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png');
        
        if (url){
          customLayer.clearLayers();
          const l = L.tileLayer(url, {
            maxNativeZoom: 24,
            maxZoom: 99,
            minZoom: 0
          });
          customLayer.addLayer(l);
          l.bringToBack();
        }
      });
      this.basemaps[_("Custom")] = customLayer;
      this.basemaps[_("None")] = L.layerGroup();
    }

    this.layersControl = new LayersControl({
        layers: this.state.imageryLayers,
        overlays: this.state.overlays,
        measurementLayers: this.state.measurementLayers
    }).addTo(this.map);

    this.autolayers = Leaflet.control.autolayers({
      overlays: {},
      selectedOverlays: [],
      baseLayers: this.basemaps
    }).addTo(this.map);

    // Drag & Drop overlays
    const addDnDZone = (container, opts) => {
        const mapTempLayerDrop = new Dropzone(container, opts);
        mapTempLayerDrop.on("addedfile", (file) => {
          this.setState({showLoading: true});
          addTempLayer(file, (err, tempLayer, filename) => {
            if (!err){
              tempLayer.addTo(this.map);
              tempLayer[Symbol.for("meta")] = {name: filename};
              this.setState(update(this.state, {
                 overlays: {$push: [tempLayer]}
              }));
              //zoom to all features
              this.map.fitBounds(tempLayer.getBounds());
            }else{
              this.setState({ error: err.message || JSON.stringify(err) });
            }
    
            this.setState({showLoading: false});
          });
        });
        mapTempLayerDrop.on("error", (file) => {
          mapTempLayerDrop.removeFile(file);
        });
    };

    addDnDZone(this.container, {url : "/", clickable : false});

    const AddOverlayCtrl = Leaflet.Control.extend({
        options: {
            position: 'topright'
        },
    
        onAdd: function () {
            this.container = Leaflet.DomUtil.create('div', 'leaflet-control-add-overlay leaflet-bar leaflet-control');
            Leaflet.DomEvent.disableClickPropagation(this.container);
            const btn = Leaflet.DomUtil.create('a', 'leaflet-control-add-overlay-button');
            btn.setAttribute("title", _("Add a temporary GeoJSON (.json) or ShapeFile (.zip) overlay"));
            
            this.container.append(btn);
            addDnDZone(btn, {url: "/", clickable: true});
            
            return this.container;
        }
    });
    new AddOverlayCtrl().addTo(this.map);

    this.map.fitWorld();
    this.map.attributionControl.setPrefix("");

    this.setState({showLoading: true});
    this.loadImageryLayers(true).then(() => {
        this.setState({showLoading: false});
        this.map.fitBounds(this.mapBounds);

        this.map.on('click', e => {
          // Find first tile layer at the selected coordinates 
          for (let layer of this.state.imageryLayers){
            if (layer._map && layer.options.bounds.contains(e.latlng)){
              this.lastClickedLatLng = this.map.mouseEventToLatLng(e.originalEvent);
              this.updatePopupFor(layer);
              layer.openPopup();
              break;
            }
          }
        }).on('popupopen', e => {
            // Load task assets links in popup
            if (e.popup && e.popup._source && e.popup._content && !e.popup.options.lazyrender){
                const infoWindow = e.popup._content;
                if (typeof infoWindow === 'string') return;

                const $assetLinks = $("ul.asset-links", infoWindow);
                
                if ($assetLinks.length > 0 && $assetLinks.hasClass('loading')){
                    const {id, project} = (e.popup._source[Symbol.for("meta")] || {}).task;

                    $.getJSON(`/api/projects/${project}/tasks/${id}/`)
                        .done(res => {
                            const { available_assets } = res;
                            const assets = AssetDownloads.excludeSeparators();
                            const linksHtml = assets.filter(a => available_assets.indexOf(a.asset) !== -1)
                                              .map(asset => {
                                                    return `<li><a href="${asset.downloadUrl(project, id)}">${asset.label}</a></li>`;
                                              })
                                              .join("");
                            $assetLinks.append($(linksHtml));
                        })
                        .fail(() => {
                            $assetLinks.append($("<li>" + _("Error: cannot load assets list.") + "</li>"));
                        })
                        .always(() => {
                            $assetLinks.removeClass('loading');
                        });
                }
            }

            if (e.popup && e.popup.options.lazyrender){
                e.popup.setContent(e.popup.options.lazyrender());
            }
        });
    }).catch(e => {
        this.setState({showLoading: false, error: e.message});
    });

    this.setState({showLoading: true});

    // Load created and uploaded layers
    this.loadUserLayers();

    PluginsAPI.Map.triggerDidAddControls({
      map: this.map,
      tiles: tiles,
      controls:{
        autolayers: this.autolayers,
        scale: scaleControl,
        zoom: zoomControl
      }
    });

    PluginsAPI.Map.triggerAddActionButton({
      map: this.map,
      tiles
    }, (button) => {
      this.setState(update(this.state, {
        pluginActionButtons: {$push: [button]}
      }));
    });
  }

  componentDidUpdate(prevProps, prevState) {
    this.state.imageryLayers.forEach(imageryLayer => {
      imageryLayer.setOpacity(this.state.opacity / 100);
      this.updatePopupFor(imageryLayer);
    });

    if (prevProps.tiles !== this.props.tiles){
      this.loadImageryLayers(true);
    }

    if (this.layersControl && (prevState.imageryLayers !== this.state.imageryLayers ||
                            prevState.overlays !== this.state.overlays) || prevState.measurementLayers !== this.state.measurementLayers){
        this.layersControl.update(this.state.imageryLayers, this.state.overlays, this.state.measurementLayers);
    }
  }

  componentWillUnmount() {
    this.map.remove();

    if (this.tileJsonRequests) {
      this.tileJsonRequests.forEach(tileJsonRequest => tileJsonRequest.abort());
      this.tileJsonRequests = [];
    }
  }

  handleMapMouseDown(e){
    // Make sure the share popup closes
    if (this.shareButton) this.shareButton.hidePopup();
  }

  render() {
    return (
      <div style={{height: "100%"}} className="map">
        <ErrorMessage bind={[this, 'error']} />
        { this.props.currentTool === MapTools.measurementTool ?
            <div>
                <MeasurementPanel map={this.state.map} measurementUpdated={this.measurementUpdated}/>
                <MeasurementTable measurementData={this.state.measurementData}/>
            </div> : <RequestServicePanel/>
        }
        <div className="opacity-slider theme-secondary hidden-xs">
            {_("Opacity:")} <input type="range" step="1" value={this.state.opacity} onChange={this.updateOpacity} />
        </div>

        <Standby 
            message={_("Loading...")}
            show={this.state.showLoading}
            />
            
        <div 
          style={{height: "100%"}}
          ref={(domNode) => (this.container = domNode)}
          onMouseDown={this.handleMapMouseDown}
        />

        <div className="actionButtons">
          {this.state.pluginActionButtons.map((button, i) => <div key={i}>{button}</div>)}
          {(!this.props.public && this.state.singleTask !== null) ? 
            <ShareButton 
              ref={(ref) => { this.shareButton = ref; }}
              task={this.state.singleTask} 
              linksTarget="map"
            />
          : ""}
          <SwitchModeButton 
            task={this.state.singleTask}
            type="mapToModel" 
            public={this.props.public} />
        </div>
      </div>
    );
  }
}

export default Map;
