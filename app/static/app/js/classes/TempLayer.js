import shp from 'shpjs';
import "proj4leaflet";
import proj4 from 'proj4';
import { _, interpolate } from './gettext';

export function addTempLayer(file, cb) {
  let maxSize = 5242880;

  //random color for each feature
  let getColor = () => {
    return 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
  }

  if (file && file.size > maxSize) {
    let err = {};
    err.message = interpolate(_("%(file)s is bigger than 5 MB."), { file: file.name });
    cb(err);
  } else {
    //get just the first file
    //file = file[0];
    let reader = new FileReader();
    let isZipFile = file.name.slice(-3) === 'zip';
    if (isZipFile) {
      //zipped shapefile
      reader.onload = function () {
        if (reader.readyState != 2 || reader.error) {
          return;
        } else {
          shp(reader.result).then(function (geojson) {
            addLayer(geojson);
          }).catch(function (err) {
            err.message = interpolate(_("Not a proper zipped shapefile: %(file)s"), { file: file.name });
            cb(err);
          })
        }
      }
      reader.readAsArrayBuffer(file);
    } else {
      //geojson file
      reader.onload = function () {
        try {
          let geojson = JSON.parse(reader.result);
          addLayer(geojson);
        } catch (err) {
          err.message = interpolate(_("Not a proper JSON file: %(file)s"), { file: file.name });
          cb(err);
        }
      }
      reader.readAsText(file);
    }
  }

  let addLayer = (_geojson) => {
    proj4.defs('EPSG:32615', '+proj=utm +zone=15 +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
    proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs\n');
    proj4.defs['OGC:CRS84'] = proj4.defs['EPSG:4326'];
    let tempLayer =
      L.Proj.geoJson(_geojson, {
        style: function (feature) {
          return {
            opacity: 1,
            fillOpacity: 0.7,
            color: getColor()
          }
        },
        //for point layers
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 6,
            color: getColor(),
            opacity: 1,
            fillOpacity: 0.7
          });
        },
        //
        onEachFeature: function (feature, layer) {
          if (feature.properties) {
            if (feature.properties) {
              layer.bindPopup(Object.keys(feature.properties).map(function (k) {
                return "<strong>" + k + ":</strong> " + feature.properties[k];
              }).join("<br />"), {
                  maxHeight: 200
                });
            }
          }
        }
      });
    tempLayer.options.bounds = tempLayer.getBounds();
    
    cb(null, tempLayer, file.name);
  }
}