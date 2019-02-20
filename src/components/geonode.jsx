import React from 'react';
global.React = React;
import ReactDOM from 'react-dom';
global.ReactDOM = ReactDOM;
import 'core-js/fn/object/assign';
import ol from 'openlayers';
import { addLocaleData, IntlProvider } from 'react-intl';
global.IntlProvider = IntlProvider;
import injectTapEventPlugin from 'react-tap-event-plugin';
import Globe from '@boundlessgeo/sdk/components/Globe';
import QGISPrint from '@boundlessgeo/sdk/components/QGISPrint';
import Zoom from '@boundlessgeo/sdk/components/Zoom';
import Rotate from '@boundlessgeo/sdk/components/Rotate';
import HomeButton from '@boundlessgeo/sdk/components/HomeButton';
import MapPanel from '@boundlessgeo/sdk/components/MapPanel';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Snackbar from 'material-ui/Snackbar';
import LayerList from '@boundlessgeo/sdk/components/LayerList';
import enLocaleData from 'react-intl/locale-data/en.js';
import InfoPopup from '@boundlessgeo/sdk/components/InfoPopup';
import MapConfigTransformService from '@boundlessgeo/sdk/services/MapConfigTransformService';
import MapConfigService from '@boundlessgeo/sdk/services/MapConfigService';
import WMSService from '@boundlessgeo/sdk/services/WMSService';
import enMessages from '@boundlessgeo/sdk/locale/en.js';
enMessages["loginmodal.helptext"] = "Login to GeoNode";
global.enMessages = enMessages;

import Save from './save';
import MapUrlLink from '../containers/MapUrlLink';
import { getLocalGeoServer, createThumbnail } from '../services/geonode';
import { getCRSFToken } from '../helper';

import '../css/app.css'
import '@boundlessgeo/sdk/dist/css/components.css';
// add by razinal
import Measure from '@boundlessgeo/sdk/components/Measure';
import ZoomToLatLon from '@boundlessgeo/sdk/components/ZoomToLatLon';
import ActionsInfo from 'material-ui/svg-icons/action/info-outline';
import Button from "@boundlessgeo/sdk/components/Button";
import { white } from 'material-ui/styles/colors';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

addLocaleData(enLocaleData);

////////////////////// added by razinal
function buildUrl(url, parameters) {
  var qs = "";
  for (var key in parameters) {
      var value = parameters[key];
      qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
  }
  if (qs.length > 0) {
      qs = qs.substring(0, qs.length - 1); //chop off last "&"
      url = url + "?" + qs;
  }
  return url;
}

var raster = new ol.layer.Tile({
  title: 'OSM Streets',
  type: 'base',
  source: new ol.source.OSM()
});
// ------------------- Coordinate
let vectorSource = new ol.source.Vector();
var iconStyle = new ol.style.Style({
  image: new ol.style.Icon({
    anchor: [12, 37],
    anchorXUnits: 'pixels', //'fraction'
    anchorYUnits: 'pixels',
    // opacity: 0.9,
    src: '../../static/isdc/img/coordinate.png'
  })
});
let vectorLayer = new ol.layer.Vector({
  title: 'Dropped Pin',
  source: vectorSource,
  style: iconStyle
});
// ------------------- Settlement Inspector
let inspectorSource = new ol.source.Vector();
var iconStyle = new ol.style.Style({
  image: new ol.style.Icon({
    anchor: [12, 37],
    anchorXUnits: 'pixels', //'fraction'
    anchorYUnits: 'pixels',
    // opacity: 0.9,
    src: '../../static/isdc/img/inspector.png'
  })
});
let inspectorVectorLayer = new ol.layer.Vector({
  title: 'Settlement Inspector',
  source: inspectorSource,
  style: iconStyle
});
// -------------------- Draw Area
var areaVectorSource = new ol.source.Vector();
var areaVectorLayer = new ol.layer.Vector({
  title: 'Drawing Area',
	source: areaVectorSource,
	style: new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(255,192,192,0.5)'
		}),
		stroke: new ol.style.Stroke({
			color: 'red',
			width: 2
		}),
		image: new ol.style.Circle({
			radius: 7,
			fill: new ol.style.Fill({
				color: 'red'
			})
		})
	})
});
// -------------------- Province Area
var areaProvinceSource = new ol.source.Vector();
var areaProvinceLayer = new ol.layer.Vector({
  title: 'Province',
	source: areaVectorSource,
	style: new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(255,192,192,0.5)'
		}),
		stroke: new ol.style.Stroke({
			color: 'red',
			width: 2
		}),
		image: new ol.style.Circle({
			radius: 7,
			fill: new ol.style.Fill({
				color: 'red'
			})
		})
	})
});
////////////////////////////// end

var map = new ol.Map({
  controls: [
    new ol.control.Attribution({ collapsible: false }),
    new ol.control.ScaleLine()
  ],
  layers: [raster, inspectorVectorLayer, areaVectorLayer, areaProvinceLayer],
  view: new ol.View({
    center: [
      0, 0
    ],
    zoom: 3
  })
});

window.setThumbnail = function (obj_id) {
  createThumbnail(obj_id, map)
}

const isdc = {
  leftbox: {
    boxShadow: 'none',
    borderRadius: '0',
    backgroundColor: 'rgba(255,255,255,1)',
    padding: '1px'
  },
  rightbox: {
    boxShadow: 'none',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: 'rgba(255,255,255,1)',
    padding: '1px'
  },
  iconBut: {
    padding: '0 0 0 0',
    width: '40px',
    height: '40px'
  }
}

let _getServer, _getLocal;
class GeoNodeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tileServices: undefined,
      errors: [],
      errorOpen: false,
      popInfo: false,
      styleIcon: "iconSize"
    };
    this._local = getLocalGeoServer(props.config.sources, props.baseUrl);
    
    // added by razinal
    _getServer = props.geoserver;
    _getLocal = props.localserver;
    window.getFunction = this;
  }

  ////////////////////////////////added by razinal
  componentDidMount() {
    new window.usngs.Converter();
  }
  // COORDINATE 
  _plotToMap(projection){
    let converter = new usngs.Converter();
    if(projection === 1) { //decimalDegree
      const inputlat = parseFloat(document.querySelector('input[name=ddlat]').value);
      const inputlon = parseFloat(document.querySelector('input[name=ddlon]').value);

      const tostringHDMS = ol.coordinate.toStringHDMS([inputlon, inputlat], 1);
      const WGS84 = tostringHDMS.split("N")[0]+' N <br/> '+tostringHDMS.split("N")[1];
      const WGS84DMS = 'lat ' + inputlat.toFixed(6) + ' <br/> lon ' + inputlon.toFixed(6);
      const UTMCoord = {};
      converter.LLtoUTM(inputlat,inputlon,UTMCoord);
      const UTM = UTMCoord[2]+'N'+' <br/> '+'Northing '+UTMCoord[1].toFixed(1) +' <br/> '+ 'Easting '+UTMCoord[0].toFixed(1);
      const MGRS = converter.LLtoMGRS(inputlat,inputlon,5);

      document.getElementById("wgs84").innerHTML=WGS84;
      document.getElementById("wgs84dms").innerHTML=WGS84DMS;
      document.getElementById("utm").innerHTML=UTM;
      document.getElementById("mgrs").innerHTML=MGRS;

      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([inputlon,inputlat])
        )
      });   
      vectorSource.addFeature(marker); 
      map.getView().setCenter(ol.proj.fromLonLat([inputlon, inputlat]));
      map.addLayer(vectorLayer); 
    } else if (projection === 2) { //degreeMinuteSeconds
      let inputlat = parseFloat(document.querySelector('input[name=latD]').value);
      inputlat += parseFloat((document.querySelector('input[name=latM]').value)/60);
      inputlat += parseFloat((document.querySelector('input[name=latS]').value)/3600);
      let inputlon = parseFloat(document.querySelector('input[name=lonD]').value);
      inputlon += parseFloat((document.querySelector('input[name=lonM]').value)/60);
      inputlon += parseFloat((document.querySelector('input[name=lonS]').value)/3600);

      const tostringHDMS = ol.coordinate.toStringHDMS([inputlon, inputlat], 1);
      const WGS84 = tostringHDMS.split("N")[0]+' N <br/> '+tostringHDMS.split("N")[1];
      const WGS84DMS = 'lat ' + inputlat.toFixed(6) + ' <br/> lon ' + inputlon.toFixed(6);
      const UTMCoord = {};
      converter.LLtoUTM(inputlat,inputlon,UTMCoord);
      const UTM = UTMCoord[2]+'N'+' <br/> '+'Northing '+UTMCoord[1].toFixed(1) +' <br/> '+ 'Easting '+UTMCoord[0].toFixed(1);
      const MGRS = converter.LLtoMGRS(inputlat,inputlon,5);

      document.getElementById("wgs84").innerHTML=WGS84;
      document.getElementById("wgs84dms").innerHTML=WGS84DMS;
      document.getElementById("utm").innerHTML=UTM;
      document.getElementById("mgrs").innerHTML=MGRS;

      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([inputlon,inputlat])
        )
      });   
      vectorSource.addFeature(marker); 
      map.getView().setCenter(ol.proj.fromLonLat([inputlon, inputlat]));
      map.addLayer(vectorLayer); 
    } else if (projection === 3) { //utm41
      const inputlat = parseFloat(document.querySelector('input[name=north41]').value);
      const inputlon = parseFloat(document.querySelector('input[name=east41]').value);
      const UTMCoordinate = converter.UTMtoLL(inputlat,inputlon,41);

      const tostringHDMS = ol.coordinate.toStringHDMS([UTMCoordinate.lon, UTMCoordinate.lat], 1);
      const WGS84 = tostringHDMS.split("N")[0]+' N <br/> '+tostringHDMS.split("N")[1];
      const WGS84DMS = 'lat ' + UTMCoordinate.lat.toFixed(6) + ' <br/> lon ' + UTMCoordinate.lon.toFixed(6);
      const MGRS = converter.LLtoMGRS(UTMCoordinate.lat,UTMCoordinate.lon,5);
      const UTM = '41 N'+' <br/> '+'Northing '+inputlat.toFixed(1) +' <br/> '+ 'Easting '+inputlon.toFixed(1);

      document.getElementById("wgs84").innerHTML=WGS84;
      document.getElementById("wgs84dms").innerHTML=WGS84DMS;
      document.getElementById("utm").innerHTML=UTM;
      document.getElementById("mgrs").innerHTML=MGRS;

      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([UTMCoordinate.lon,UTMCoordinate.lat])
        )
      });   
      vectorSource.addFeature(marker); 
      map.getView().setCenter(ol.proj.fromLonLat([UTMCoordinate.lon, UTMCoordinate.lat]));
      map.addLayer(vectorLayer);       
    } else if (projection === 4) { //utm42
      const inputlat = parseFloat(document.querySelector('input[name=north42]').value);
      const inputlon = parseFloat(document.querySelector('input[name=east42]').value);

      const UTMCoordinate = converter.UTMtoLL(inputlat,inputlon,42);
      const tostringHDMS = ol.coordinate.toStringHDMS([UTMCoordinate.lon, UTMCoordinate.lat], 1);
      const WGS84 = tostringHDMS.split("N")[0]+' N <br/> '+tostringHDMS.split("N")[1];
      const WGS84DMS = 'lat ' + UTMCoordinate.lat.toFixed(6) + ' <br/> lon ' + UTMCoordinate.lon.toFixed(6);
      const MGRS = converter.LLtoMGRS(UTMCoordinate.lat,UTMCoordinate.lon,5);
      const UTM = '42 N'+' <br/> '+'Northing '+inputlat.toFixed(1) +' <br/> '+ 'Easting '+inputlon.toFixed(1);

      document.getElementById("wgs84").innerHTML=WGS84;
      document.getElementById("wgs84dms").innerHTML=WGS84DMS;
      document.getElementById("utm").innerHTML=UTM;
      document.getElementById("mgrs").innerHTML=MGRS;

      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([UTMCoordinate.lon,UTMCoordinate.lat])
        )
      });   
      vectorSource.addFeature(marker); 
      map.getView().setCenter(ol.proj.fromLonLat([UTMCoordinate.lon, UTMCoordinate.lat]));
      map.addLayer(vectorLayer);      
    } else { //MGRS
      const inputmgrs = document.querySelector('input[name=mgrs]').value;

      const UTMCoord = {};
      const LLCoordinate = converter.USNGtoLL(inputmgrs);
      converter.LLtoUTM(LLCoordinate.north,LLCoordinate.east,UTMCoord);

      const tostringHDMS = ol.coordinate.toStringHDMS([LLCoordinate.east, LLCoordinate.north], 1);
      const WGS84 = tostringHDMS.split("N")[0]+' N <br/> '+tostringHDMS.split("N")[1];
      const WGS84DMS = 'lat ' + LLCoordinate.north.toFixed(6) + ' <br/> lon ' + LLCoordinate.east.toFixed(6);
      const MGRS = converter.LLtoMGRS(LLCoordinate.north,LLCoordinate.east,5);
      const UTM = UTMCoord[2]+'N'+' <br/> '+'Northing '+UTMCoord[1].toFixed(1) +' <br/> '+ 'Easting '+UTMCoord[0].toFixed(1);

      document.getElementById("wgs84").innerHTML=WGS84;
      document.getElementById("wgs84dms").innerHTML=WGS84DMS;
      document.getElementById("utm").innerHTML=UTM;
      document.getElementById("mgrs").innerHTML=MGRS;

      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([LLCoordinate.east,LLCoordinate.north])
        )
      });   
      vectorSource.addFeature(marker); 
      map.getView().setCenter(ol.proj.fromLonLat([LLCoordinate.east, LLCoordinate.north]));
      map.addLayer(vectorLayer);      
    }
  }

  _pickFromMap(pickFromMap) {
    const getLatLong = (e) => {
      e.preventDefault();
      let converter = new usngs.Converter();
      const coord = e.coordinate;
      const degrees = ol.proj.transform(coord, 'EPSG:900913', 'EPSG:4326');
      const lon = degrees[0];
      const lat = degrees[1];

      const tostringHDMS = ol.coordinate.toStringHDMS(degrees, 1);
      const WGS84 = tostringHDMS.split("N")[0]+' N <br/> '+tostringHDMS.split("N")[1];
      const WGS84DMS = 'lat ' + lat.toFixed(6) + ' <br/> lon ' + lon.toFixed(6);

      const UTMCoord = {};
      converter.LLtoUTM(lat,lon,UTMCoord);
      const UTM = UTMCoord[2]+'N'+' <br/> '+'Northing '+UTMCoord[1].toFixed(1) +' <br/> '+ 'Easting '+UTMCoord[0].toFixed(1);
      const MGRS = converter.LLtoMGRS(lat,lon,5);

      // addmarker
      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([lon,lat])
        )
      });   
      vectorSource.addFeature(marker); 
      // map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
      // map.getView().setZoom(6);
      map.addLayer(vectorLayer); 
      //// end marker
      document.getElementById("wgs84").innerHTML=WGS84;
      document.getElementById("wgs84dms").innerHTML=WGS84DMS;
      document.getElementById("utm").innerHTML=UTM;
      document.getElementById("mgrs").innerHTML=MGRS;
    };
    if (pickFromMap === true) {
      map.on('singleclick', getLatLong);
    } else {
      map.removeLayer(vectorLayer);
      vectorLayer.getSource().clear();
      document.getElementById("wgs84").innerHTML = '';
      document.getElementById("wgs84dms").innerHTML = '';
      document.getElementById("utm").innerHTML = '';
      document.getElementById("mgrs").innerHTML = '';
      map.removeEventListener('singleclick');
    }
  }

  _clearCoordinat(){
    map.removeLayer(vectorLayer);
    vectorLayer.getSource().clear();
    document.getElementById("wgs84").innerHTML='';
    document.getElementById("wgs84dms").innerHTML='';
    document.getElementById("utm").innerHTML='';
    document.getElementById("mgrs").innerHTML='';
  }

  // DRAW AREA
  _drawArea(draw) {
    var drawInteraction;
    const drawArea = () => {
      drawInteraction = new ol.interaction.Draw({
        source: areaVectorSource,
        type: 'Polygon'
      });
      map.addInteraction(drawInteraction);
      drawInteraction.on('drawend', function (evt) {
        map.removeInteraction(drawInteraction);
        areaVectorSource.clear();
        map.removeLayer(areaVectorLayer);
        map.addLayer(areaVectorLayer);
        var format = new ol.format.WKT();
        var geometry = (evt.feature.getGeometry()).clone();
        try {
          var f = format.writeGeometry(geometry.transform('EPSG:900913', 'EPSG:4326'));
          console.log(f);
          // window.getBaselineArea._getBaselineArea(f);
          window._getPoylgon = f;
        } catch (e) {
          console.log(e);
        }
      });
    }
    const drawnEnd = () => {
      map.removeInteraction(drawInteraction);
    }

    if (draw === true) {
      drawArea();
    } else {
      drawnEnd();
      areaVectorSource.clear();
      map.removeLayer(areaVectorLayer);
    }
  }

  //SETLEMENTS INSPECTOR
  _setlementsInpector(getInspector){
    const LatLongInspector = (e) => {
      e.preventDefault();
      const coord = e.coordinate;
      const degrees = ol.proj.transform(coord, 'EPSG:900913', 'EPSG:4326');
      const lon = degrees[0];
      const lat = degrees[1];
      // addmarker
      map.removeLayer(inspectorVectorLayer);
      inspectorVectorLayer.getSource().clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([lon,lat])
        )
      });   
      inspectorSource.addFeature(marker); 
      // map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
      // map.getView().setZoom(6);
      map.addLayer(inspectorVectorLayer); 


      const zoom = map.getView().getZoom(); 
      const viewResolution = /** @type {number} */ (map.getView().getResolution());
      const minx = coord[0] - viewResolution * 500;
      const maxx = coord[0] + viewResolution * 500;
      const miny = coord[1] - viewResolution * 500;
      const maxy = coord[1] + viewResolution * 500;
      const settlementBbox = minx+','+miny+','+maxx+','+maxy; 
      
      console.log(_getLocal);
      console.log(_getServer);

      const insUrl = _getServer+'wms';
      // const insUrl = _getLocal+'/proxy/?url='+_getServer+'wms';
      // const insUrl = _getLocal+'/proxy/?url='+encodeURIComponent(_getServer+'wms');
      console.log(insUrl);

      const getMapId = document.getElementById("map");
      const getComputedStyle = getMapId.getBoundingClientRect();
      const widthX = /** @type {number} */ (getComputedStyle.width / 2);
      const heightY = /** @type {number} */ (getComputedStyle.height / 2);

      const params = {
        LAYERS: 'geonode:afg_ppla',
        QUERY_LAYERS: 'geonode:afg_ppla',
        STYLES: 'polygon',
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetFeatureInfo',
        BBOX: settlementBbox,
        FEATURE_COUNT: '10',
        HEIGHT: getComputedStyle.height,
        WIDTH: getComputedStyle.width,
        FORMAT: 'image/png8',
        INFO_FORMAT: 'application/json',
        SRS:'EPSG:900913',
        X: Math.trunc(widthX),
        Y: Math.trunc(heightY)
      }
      
      let getVuid = {};
      fetch(buildUrl(insUrl, params), {
        credentials: 'include',
        method: 'GET',
        headers: {
          'Accept': '*/*',
          // "Content-Type": "application/json; charset=utf-8",
          // 'X-CSRFToken': getCRSFToken(),
          // 'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(response => {
          if (response.ok) {
            response.json().then(json => {
              getVuid['features'] = json.features;
              window.inspectorFunction._handleInspector(lon,lat,getVuid);
            });
          }
        })
        
      //// end marker
    };

    if (getInspector === true) {
      map.on('singleclick', LatLongInspector);
    } else {
      map.removeLayer(inspectorVectorLayer);
      inspectorVectorLayer.getSource().clear();
      map.removeEventListener('singleclick');
    }
  }

  _selectedProv(provFeatures){
    const geojson = {
      "type": "Feature",
      "geometry": provFeatures[0].geometry,
      "properties": {
        "name": provFeatures[0].properties.prov_na_en
      }
    }
    const geojsonObject = {
      'type': 'FeatureCollection',
      "crs": {
        "type": "name",
        "properties": {
          "name": "urn:ogc:def:crs:EPSG::900913"
        }
      },
      'features': [geojson]
    }
    console.log(geojsonObject);
    
    // var vectorSource = new ol.source.Vector({
    //   features: (new ol.format.GeoJSON()).readFeatures(geojsonObject, { defaultDataProjection: 'EPSG:4326',featureProjection:'EPSG:3857' })
    // });

    const areaProvSelected = new ol.Feature({
      geometry: new ol.Feature((new ol.format.GeoJSON()).readFeatures(geojsonObject))
    }); 
    areaProvinceSource.addFeature(areaProvSelected);

    // var vectorLayer = new ol.layer.Vector({
    //   source: vectorSource,
    //   style: styleFunction
    // });

    map.addLayer(areaProvinceLayer); 
    // map.getView().setZoom(6);
  }
  ////////////////////////// end

  getChildContext() {
    return {
      proxy: this.props.proxy,
      requestHeaders: {
        'X-CSRFToken': getCRSFToken()
      },
      muiTheme: getMuiTheme(this.props.theme)
    };
  }
  componentWillMount() {
    this.updateMap(this.props);
    this.mode = this.props.mode || 'viewer';
    this.edit = (this.mode === 'composer');
  }
  componentWillReceiveProps(props) {
    this.updateMap(props);
  }
  updateMap(props) {
    if (props.config) {
      var tileServices = [];
      var errors = [];
      var filteredErrors = [];
      if (props.zoomToLayer && props.config.map.layers[props.config.map.layers.length - 1].bbox) {
        this._extent = props.config.map.layers[props.config.map.layers.length - 1].bbox;
      }
      MapConfigService.load(MapConfigTransformService.transform(props.config, errors, tileServices, props.crossOriginCredentials), map, this.props.proxy);
      for (var i = 0, ii = errors.length; i < ii; ++i) {
        // ignore the empty baselayer since we have checkbox now for base layer group
        // ignore the empty layer from the local source
        if (errors[i].layer.type !== 'OpenLayers.Layer' && errors[i].msg !== 'Unable to load layer undefined') {
          if (window.console && window.console.warn) {
            window.console.warn(errors[i]);
          }
          filteredErrors.push(errors[i]);
        }
      }
      this.setState({ errors: filteredErrors, errorOpen: true, tileServices: tileServices });
    }
  }
  _handleRequestClose() {
    this.setState({ errorOpen: false });
  }
  _createLayerList() {
    let layerList;
    if (this._local) {
      layerList = {
        sources: [
          {
            title: this._local.title,
            url: this._local.url,
            type: 'WMS'
          }
        ],
        allowUserInput: true
      };
    } else {
      layerList = {
        sources: [
          {
            title: 'Local Geoserver',
            url: this.props.baseUrl + 'wms',
            type: 'WMS'
          }
        ],
        allowUserInput: true
      };
    }
    return layerList;
  }

  _handleClickPop() {
    this.setState({ popInfo: !this.state.popInfo });
  }

  render() {
    var error;
    if (this.state.errors.length > 0) {
      var msg = '';
      for (var i = 0, ii = this.state.errors.length; i < ii; i++) {
        msg += this.state.errors[i].msg + '. ';
      }
      error = (<Snackbar autoHideDuration={5000} open={this.state.errorOpen} message={msg} onRequestClose={this._handleRequestClose.bind(this)} />);
    }
    let layerList,
      save,
      mapUrl;
    if (this.edit) {
      layerList = this._createLayerList();
      if (this.props.server) {
        save = (
          <div id='save-button' className='geonode-save'><Save tooltipPosition='right' map={map} /></div>
        );
        mapUrl = (<MapUrlLink />);
      }
    }

    return (
      <div id='content'>
        {error}
        <MapPanel useHistory={true} id='map' map={map} extent={this._extent} />

        <div id='mapleftbox'></div>

        <div id='maprightbox'>
          <div id='layerlist'><LayerList style={isdc.rightbox} className={"layerListStyle"} showZoomTo={true} addBaseMap={true} baseMapTileServices={this.state.tileServices} addLayer={layerList} showTable={true} allowReordering={true} includeLegend={true} allowRemove={this.edit} tooltipPosition='left' allowStyling={this.edit || this.props.zoomToLayer} map={map} /></div>
          <div id='home-button'><HomeButton className={"hoverButton"} style={isdc.leftbox} extent={this._extent} tooltipPosition='left' map={map} /></div>
          <div id='zoom-buttons'><Zoom style={isdc.leftbox} tooltipPosition='left' map={map} /></div>
          {/* <div id='buttonpanel'>
            <Button className={"hoverButton"} style={isdc.iconBut} tooltipPosition='right' buttonType='Icon' tooltip='Get feature info' secondary={this.state.popInfo} onTouchTap={this._handleClickPop.bind(this)}>
              <ActionsInfo color={white} />
            </Button>
          </div>
          <div id='buttonpanel'><Measure className={"hoverButton"} style={isdc.iconBut} map={map} tooltipPosition='right' /></div>
          <div id='buttonpanel'><ZoomToLatLon className={"hoverButton"} style={isdc.iconBut} map={map} tooltipPosition='right' /></div> */}
          <div id='globe-button'><Globe className={"hoverButton"} style={isdc.leftbox} tooltipPosition='left' map={map} /></div>
          <div id='print-button'><QGISPrint className={"hoverButton"} style={isdc.leftbox} menu={false} map={map} tooltipPosition='left' layouts={this.props.printLayouts} /></div>
          <div id='rotate-button'><Rotate autoHide={true} tooltipPosition='left' map={map} /></div>        
        </div>
        <div id='popup' className='ol-popup'><InfoPopup popactive={this.state.popInfo} toggleGroup='navigation' toolId='nav' infoFormat='application/vnd.ogc.gml' map={map} /></div>
        {save}
        {mapUrl}
      </div>
    );
  }
}

GeoNodeViewer.props = {
  config: React.PropTypes.object,
  loadMapConfig: React.PropTypes.bool,
  proxy: React.PropTypes.string,
  theme: React.PropTypes.object,
  mode: React.PropTypes.string,
  server: React.PropTypes.string,
  printLayouts: React.PropTypes.array,
  crossOriginCredentials: React.PropTypes.bool
};

GeoNodeViewer.defaultProps = {
  theme: {
    floatingActionButton: {
      // iconColor: '#fff',
      iconColor: '#717171',
      // color: '#2c689c'
      color: 'rgba(255,255,255,1)'
      // color: 'rgb(0, 188, 212)'
    },
    toolbar: {
      backgroundColor: '#333'
    },
    palette: {
      primary1Color: '#2c689c',
      primary2Color: '#2c689c',
      primary3Color: '#2c689c',
      accent1Color: '#2c689c',
      accent2Color: '#2c689c',
      accent3Color: '#2c689c',
      textColor: '#2E506D',
      secondaryTextColor: '#fff',
      alternateTextColor: '#fff',
      canvasColor: '#fff'
    }
  },
  printLayouts: [
    {
      "width": 297.0,
      "elements": [
        {
          "name": "Title",
          "height": 12.105490848585688,
          "width": 143.0648918469218,
          "y": 2.7512479201331113,
          "x": 5.777620632279534,
          "font": "",
          "type": "label",
          "id": "cc8bd50f36e44ac3a3e5daf48d038f7c",
          "size": 18
        }, {
          "height": 187.0,
          "width": 286.0,
          "grid": {
            "intervalX": 0.0,
            "intervalY": 0.0,
            "annotationEnabled": false,
            "crs": ""
          },
          "y": 17.0,
          "x": 6.0,
          "type": "map",
          "id": "3bde6dd61cdf480eae1a67db59d74035"
        }
      ],
      "thumbnail": "geonode_thumbnail.png",
      "name": "geonode",
      "height": 210.0
    }
  ]
};

GeoNodeViewer.childContextTypes = {
  proxy: React.PropTypes.string,
  requestHeaders: React.PropTypes.object,
  muiTheme: React.PropTypes.object
};

export default GeoNodeViewer;
global.GeoNodeViewer = GeoNodeViewer;
