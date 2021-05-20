import axios from 'axios';
import WMSCapabilities from 'wms-capabilities';

class UserLayers {
    constructor(capabilities = {}, geoserverUrl) {
        this.capabilities = capabilities;
        this.geoserverUrl = geoserverUrl;
    }

    getUploaderLayers() {
        const apiUrl = '/api/layers/';
        return new Promise((resolve, reject) => axios.get(apiUrl, {
            timeout: 5000
        }).then(response => {
            resolve(response.data);
        }).catch(function (error) {
            console.log(error)
            reject();
        }))
    }

    async getCapabilities() {
        const wmsUrl = this.geoserverUrl + '/wms?service=wms&version=1.1.1&request=GetCapabilities';
        this.capabilities = new WMSCapabilities(await axios.get(wmsUrl).then((res)=> res.data)).toJSON();
    }

    getBoundingBox(layerName) {
        const layers = this.capabilities?.Capability?.Layer?.Layer;
        const layer = layers?.filter(
          (l) => l.Name === `${layerName}`
        )[0];
        const bbox = layer?.LatLonBoundingBox;
        if(bbox) {
            return [
              [bbox[1], bbox[0]],
              [bbox[3], bbox[2]],
            ];
        }
        return null;
    }

}

export default UserLayers;
