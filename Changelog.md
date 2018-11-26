# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Added

- added documentation
- added tests & test setup
- added CD via travis
- added a `index-gh.html` with aboslute paths for repo
- added abstraction `viewer` to easy the usage
- added `componentWillReceiveProps` to geonodeViewer component

### Changed

- moved viewer setup into `componentWillMount`

#### Changed by Razinal

- added props `tooltipPosition` to `@boundlessgeo/sdk/components/Measure.js`
- added state `popactive` to `@boundlessgeo/sdk/components/InfoPopup.js`
- added function `componentWillReceiveProps` to `@boundlessgeo/sdk/components/InfoPopup.js`

```javascript
{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (nextProps.popactive !== this.state.popactive) {
        this.setState({ popactive: nextProps.popactive });
      }
    }
  }
```

- change `if (this.active)` to `if (this.state.popactive === true)` on component `_onMapClick` in `@boundlessgeo/sdk/components/InfoPopup.js`