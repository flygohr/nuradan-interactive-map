//Creating the Map
var map = L.map('map', {
    crs: L.CRS.Simple,
    center: [-15.856962, 47.862135], // change it to receive URL parameters https://blog.mastermaps.com/2012/10/how-to-control-your-leaflet-map-with.html
    zoom: 7,
});

var tilesH = 44;
var tilesW = 78;
var tileSize = 256;
var maxZoom = 8;
var sw = map.unproject([0, tilesH * tileSize], maxZoom);
var ne = map.unproject([tilesW * tileSize, 0], maxZoom);
var bounds = L.latLngBounds(sw, ne);

var gridSize = tileSize/8;
var gridW = (tileSize*tilesW)/gridSize;
var gridH = (tileSize*tilesH)/gridSize;
var gridSizeCRS = tilesW/gridW;

// console.log(gridSizeCRS) // 0.125, or grid step size for mapping grid purposes

// gdal raster tile --webviewer leaflet --tiling-scheme raster --tile-size 256 --min-zoom=5 --max-zoom=8 map.png layer_folder

let base = L.tileLayer('images/base/{z}/{x}/{y}.png', {
    maxNativeZoom: 8,
    minNativeZoom: 5,
    minZoom: 4,
    maxZoom: 9,
    noWrap: true,
    bounds: bounds,
    attribution: '&copy; <a href="https://nuradan.flygohr.com" target="_top">Nuradan Project</a>'
});

let pop = L.tileLayer('images/pop/{z}/{x}/{y}.png', {
    maxNativeZoom: 8,
    minNativeZoom: 5,
    minZoom: 6,
    maxZoom: 9,
    noWrap: true,
    bounds: bounds,
});

let zones_overlay = L.tileLayer('images/zones/{z}/{x}/{y}.png', {
    maxNativeZoom: 8,
    minNativeZoom: 5,
    minZoom: 6,
    maxZoom: 9,
    noWrap: true,
    bounds: bounds,
})

base.addTo(map);
// roads.addTo(map);
pop.addTo(map)

// Show gridlines
let coordinatesGridLines = []
for(i = 0; i < gridW; i++) {
    let line = L.polyline([[0, i*gridSizeCRS], [-gridSizeCRS*gridH, i*gridSizeCRS]], {color: "#E6D8AB", weight: 1, opacity: 0.3, fillOpacity: 0.1})
    coordinatesGridLines.push(line)
}

for(i = 0; i < gridH; i++) {
    let line = L.polyline([[-i*gridSizeCRS, 0], [-i*gridSizeCRS, gridSizeCRS*gridW]], {color: "#E6D8AB", weight: 1, opacity: 0.3, fillOpacity: 0.1})
    coordinatesGridLines.push(line)
}

let coordinatesGridGroup = L.layerGroup(coordinatesGridLines)


var layerControl = L.control.layers(null, null).addTo(map);
layerControl.addOverlay(pop, "Settlements")

// PARSE ZONES DATA AND CREATE RECTANGLES

Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vSM4eS6uvkkqNa3oiwHHxu6aO7HTzRv4OcJSNQyKjl7IL6zcldcO9QoF2KWt__ZtvmMsQ74aTogYREQ/pub?gid=0&single=true&output=csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        console.log(results);
        createZones(results);
    }
})

function createZones(zonesData) {

    let zonesRectangles = []

    for(i = 0; i < zonesData.data.length; i++) {

        var zone = L.rectangle([
            [gridSizeCRS * zonesData.data[i].y, gridSizeCRS * zonesData.data[i].x], // NW
            [gridSizeCRS * (zonesData.data[i].y - zonesData.data[i].height), gridSizeCRS * (zonesData.data[i].x + zonesData.data[i].width)] // SW
        ],
        {color: "#E6D8AB", weight: 1, opacity: 0.4, fillOpacity: 0.1})

        let popupHTML = '<b><a href="' + zonesData.data[i].URL + '" target="_top">' + zonesData.data[i].name + '</a></b>'
        zone.bindPopup(popupHTML)

        zonesRectangles.push(zone)
    };

    console.log(zonesRectangles)
    let zone_boundaries = L.layerGroup(zonesRectangles)
    // zone_boundaries.addTo(map)
    layerControl.addOverlay(zone_boundaries, "Zones")

}

layerControl.addOverlay(zones_overlay, "Debug: zone boundaries")
layerControl.addOverlay(coordinatesGridGroup, "Debug: coordinates grid")

// TODO: add hover effects

map.setMaxBounds(bounds);




let NuradanIconSmall = L.Icon.extend({
    options: {
        shadowUrl: 'images/icons/64/shadow.png',
        iconSize:     [32, 32],
        shadowSize:   [32, 32],
        iconAnchor:   [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor:  [16, -16]
    }
});

let markerIcon = new NuradanIconSmall({iconUrl: 'images/icons/64/marker.png'}),
    villageIcon = new NuradanIconSmall({iconUrl: 'images/icons/64/village.png'}),
    encampmentIcon = new NuradanIconSmall({iconUrl: 'images/icons/64/encampment.png'});
    dungeonIcon = new NuradanIconSmall({iconUrl: 'images/icons/64/dungeon.png'});
    bridgeIconH = new NuradanIconSmall({iconUrl: 'images/icons/64/bridge_h.png'});
    bridgeIconH = new NuradanIconSmall({iconUrl: 'images/icons/64/bridge_v.png'});
    castleIcon = new NuradanIconSmall({iconUrl: 'images/icons/64/castle.png'});

//Coordinate Finder
let marker = L.marker([-16.320367, 48.311807], {
    icon: markerIcon,
    draggable: true,
}).addTo(map);
marker.bindPopup('Move to show coordinates').openPopup();
marker.on('dragend', function (e) {
    let cellLat = Math.trunc(marker.getLatLng().lat/gridSizeCRS)
    let cellLng = Math.trunc(marker.getLatLng().lng/gridSizeCRS)
    let preciseCoords = marker.getLatLng().toString()
    let popupString = cellLat + ", " + cellLng + "<br />" + preciseCoords
    marker.getPopup().setContent(popupString).openOn(map);
});

//Markers
// TODO: export icons for cities, castles, ruins, towns, etc to use with markers 
// https://leafletjs.com/examples/custom-icons/
var mts_sund = L.marker([-gridSizeCRS*130.5, gridSizeCRS*377.5], {icon: villageIcon}).bindPopup('<b><a href="https://worldbuilding.flygohr.com/Sund" target="_top">Sund</a></b>');

var settlementsGroup = L.layerGroup([mts_sund])
settlementsGroup.addTo(map)
layerControl.addOverlay(POIs, "Settlements")

map.on('zoomend', function() {
    if (map.getZoom() <7){
            map.removeLayer(settlementsGroup);
    }
    else {
            map.addLayer(settlementsGroup);
        }
});