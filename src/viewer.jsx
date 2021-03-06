import React from 'react';
import ReactDOM from 'react-dom';
import GeoNodeViewer from './components/geonode';
import enMessages from '@boundlessgeo/sdk/locale/en.js';
import {IntlProvider} from 'react-intl';

class Viewer {
  constructor(domId, options) {
    this._domId = domId;
    this._mapConfig = options.mapConfig;
    this._proxy = options.proxy;
    this._zoomToLayer = options.zoomToLayer;
    this._printLayouts = options.printLayouts;
    this._theme = options.theme;
    this._crossOriginCredentials = options.crossOriginCredentials;
    this._geoserver = options.mapConfig.localGeoServerBaseUrl;
    this._localserver = options.server;
  }
  set mapConfig(value) {
    this._mapConfig = value;
  }
  set proxy(value) {
    this._proxy = value;
  }
  set zoomToLayer(value) {
    this._zoomToLayer = value;
  }
  set printLayouts(value) {
    this._printLayouts = value; 
  }
  set theme(value) {
    this._theme = value;
  }
  set geoserver(value){
    this._geoserver = value;
  }
  set localserver(value){
    this._localserver = value;
  }
  view() {
    ReactDOM.render(
      <IntlProvider locale='en' messages={enMessages}>
        <GeoNodeViewer 
          theme={this._theme} 
          printLayouts={this._printLayouts} 
          zoomToLayer={this._zoomToLayer} 
          config={this._mapConfig} 
          proxy={this._proxy} 
          crossOriginCredentials={this._crossOriginCredentials} 
          geoserver={this._geoserver}
          localserver={this._localserver}
        />
      </IntlProvider>, document.getElementById(this._domId));
  }
}

module.exports = Viewer;
