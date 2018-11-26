var formatArea = function (polygon) {
    var area = polygon.getArea()
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
    }
    return output;
    console.log(output);
};
function createMeasureTooltip() {
    measureTooltipElement = undefined;
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.id = 'measure_id';
    measureTooltipElement.className = 'tooltip-draw tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}

drawArea = new ol.interaction.Draw({
    source: areaVectorSource,
    type: 'Polygon',
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            // color: 'rgba(0, 0, 0, 0.5)',
            color: 'red',
            lineDash: [10, 10],
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 5,
            stroke: new ol.style.Stroke({
                color: 'red'
                // color: 'rgba(0, 0, 0, 0.7)'
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            })
        })
    })
});
map.addInteraction(drawArea);

createMeasureTooltip();
drawArea.on('drawstart', function (evt) {
    var sketch = evt.feature;
    var tooltipCoord = evt.coordinate;
    sketch.getGeometry().on('change', function (evt) {
        var geom = evt.target;
        var output;
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
        measureTooltipElement.innerHTML = output;
        measureTooltip.setPosition(tooltipCoord);
    });
});

drawArea.on('drawend', function () {
    measureTooltipElement.className = 'tooltip-draw tooltip-static';
    measureTooltip.setOffset([0, -7]);
    createMeasureTooltip();
});

map.addLayer(areaVectorLayer);


map.removeLayer(areaVectorLayer);
areaVectorLayer.getSource().clear();
map.removeInteraction(drawInteraction);