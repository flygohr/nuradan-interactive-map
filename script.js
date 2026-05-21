//Creating the Map

let params = {};
window.location.href.replace(
  /[?&]+([^=&]+)=([^&]*)/gi,
  function (m, key, value) {
    params[key] = value;
  },
);

let map = L.map("map", {
  crs: L.CRS.Simple,
  center: [params.lat || -22, params.lng || 39], // change it to receive URL parameters https://blog.mastermaps.com/2012/10/how-to-control-your-leaflet-map-with.html
  zoom: 7,
});

let tilesH = 44;
let tilesW = 78;
let tileSize = 256;
let maxZoom = 8;
let sw = map.unproject([0, tilesH * tileSize], maxZoom);
let ne = map.unproject([tilesW * tileSize, 0], maxZoom);
let bounds = L.latLngBounds(sw, ne);

let gridSize = tileSize / 8;
let gridW = (tileSize * tilesW) / gridSize;
let gridH = (tileSize * tilesH) / gridSize;
let gridSizeCRS = tilesW / gridW;

// console.log(gridSizeCRS) // 0.125, or grid step size for mapping grid purposes

// gdal raster tile --webviewer leaflet --tiling-scheme raster --tile-size 256 --min-zoom=5 --max-zoom=8 map.png layer_folder

let base = L.tileLayer("images/base/{z}/{x}/{y}.png", {
  maxNativeZoom: 8,
  minNativeZoom: 5,
  minZoom: 4,
  maxZoom: 8,
  noWrap: true,
  bounds: bounds,
  attribution:
    '&copy; <a href="https://nuradan.flygohr.com" target="_top">Nuradan Project</a>',
});

let zones_overlay = L.tileLayer("images/zones/{z}/{x}/{y}.png", {
  maxNativeZoom: 8,
  minNativeZoom: 5,
  minZoom: 6,
  maxZoom: 8,
  noWrap: true,
  bounds: bounds,
});

base.addTo(map);

// Show gridlines
let coordinatesGridLines = [];
for (i = 0; i < gridW; i++) {
  let line = L.polyline(
    [
      [0, i * gridSizeCRS],
      [-gridSizeCRS * gridH, i * gridSizeCRS],
    ],
    { color: "#E6D8AB", weight: 1, opacity: 0.3, fillOpacity: 0.1 },
  );
  coordinatesGridLines.push(line);
}

for (i = 0; i < gridH; i++) {
  let line = L.polyline(
    [
      [-i * gridSizeCRS, 0],
      [-i * gridSizeCRS, gridSizeCRS * gridW],
    ],
    { color: "#E6D8AB", weight: 1, opacity: 0.3, fillOpacity: 0.1 },
  );
  coordinatesGridLines.push(line);
}

let coordinatesGridGroup = L.layerGroup(coordinatesGridLines);

let layerControl = L.control.layers(null, null).addTo(map);

// PARSE ZONES DATA AND CREATE RECTANGLES

Papa.parse(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSM4eS6uvkkqNa3oiwHHxu6aO7HTzRv4OcJSNQyKjl7IL6zcldcO9QoF2KWt__ZtvmMsQ74aTogYREQ/pub?gid=0&single=true&output=csv",
  {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      console.log(results);
      createZones(results);
    },
  },
);

function createZones(zonesData) {
  let zonesRectangles = [];

  for (i = 0; i < zonesData.data.length; i++) {
    let zone = L.rectangle(
      [
        [gridSizeCRS * zonesData.data[i].y, gridSizeCRS * zonesData.data[i].x], // NW
        [
          gridSizeCRS * (zonesData.data[i].y - zonesData.data[i].height),
          gridSizeCRS * (zonesData.data[i].x + zonesData.data[i].width),
        ], // SW
      ],
      { color: "#E6D8AB", weight: 1, opacity: 0.4, fillOpacity: 0.1 },
    );

    let popupHTML =
      '<b><a href="' +
      zonesData.data[i].URL +
      '" target="_top">' +
      zonesData.data[i].name +
      "</a></b>";
    zone.bindPopup(popupHTML);

    zonesRectangles.push(zone);
  }

  console.log(zonesRectangles);
  let zone_boundaries = L.layerGroup(zonesRectangles);
  // zone_boundaries.addTo(map)
  layerControl.addOverlay(zone_boundaries, "Zones");
}

layerControl.addOverlay(zones_overlay, "Debug: zone boundaries");
layerControl.addOverlay(coordinatesGridGroup, "Debug: coordinates grid");

// TODO: add hover effects

map.setMaxBounds(bounds);

let NuradanIconSmall = L.Icon.extend({
  options: {
    shadowUrl: "images/icons/64/shadow.png",
    iconSize: [32, 32],
    shadowSize: [32, 32],
    iconAnchor: [16, 16],
    shadowAnchor: [16, 16],
    popupAnchor: [0, -8],
  },
});

let NuradanIconLarge = L.Icon.extend({
  options: {
    shadowUrl: "images/icons/128/shadow.png",
    iconSize: [64, 64],
    shadowSize: [64, 64],
    iconAnchor: [32, 32],
    shadowAnchor: [32, 32],
    popupAnchor: [0, -16],
  },
});

let markerIcon = new NuradanIconSmall({
    iconUrl: "images/icons/64/marker.png",
  }),
  villageIcon = new NuradanIconSmall({
    iconUrl: "images/icons/64/village.png",
  }),
  encampmentIcon = new NuradanIconSmall({
    iconUrl: "images/icons/64/encampment.png",
  });
dungeonIcon = new NuradanIconSmall({ iconUrl: "images/icons/64/dungeon.png" });
bridgeIconH = new NuradanIconSmall({ iconUrl: "images/icons/64/bridge_h.png" });
bridgeIconV = new NuradanIconSmall({ iconUrl: "images/icons/64/bridge_v.png" });
castleIcon = new NuradanIconSmall({ iconUrl: "images/icons/64/castle.png" });

let townIcon = new NuradanIconLarge({ iconUrl: "images/icons/128/town.png" });

//Coordinate Finder
let marker = L.marker([-16.320367, 48.311807], {
  icon: markerIcon,
  draggable: true,
}).addTo(map);
marker.bindPopup("Move to show coordinates").openPopup();
marker.on("dragend", function (e) {
  let cellLat = Math.trunc(marker.getLatLng().lat / gridSizeCRS);
  let cellLng = Math.trunc(marker.getLatLng().lng / gridSizeCRS);
  let preciseCoords = marker.getLatLng().toString();
  let popupString = cellLat + ", " + cellLng + "<br />" + preciseCoords;
  marker.getPopup().setContent(popupString).openOn(map);
});

//Markers
let settlementsLayer = new L.FeatureGroup();

Papa.parse(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSM4eS6uvkkqNa3oiwHHxu6aO7HTzRv4OcJSNQyKjl7IL6zcldcO9QoF2KWt__ZtvmMsQ74aTogYREQ/pub?gid=46754673&single=true&output=csv",
  {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      console.log(results);
      createMarkers(results);
    },
  },
);

function createMarkers(markersData) {
  let allMarkers = [];

  for (i = 0; i < markersData.data.length; i++) {
    let markerTypeIcon;
    switch (markersData.data[i].type) {
      case "village":
        markerTypeIcon = villageIcon;
        break;
      case "castle":
        markerTypeIcon = castleIcon;
        break;
      case "bridge_h":
        markerTypeIcon = bridgeIconH;
        break;
      case "bridge_v":
        markerTypeIcon = bridgeIconV;
        break;
      case "encampment":
        markerTypeIcon = encampmentIcon;
        break;
      case "dungeon":
        markerTypeIcon = dungeonIcon;
        break;
      case "town":
        markerTypeIcon = townIcon;
        break;
      default:
        markerTypeIcon = markerIcon;
    }

    let markerHTML =
      '<b><a href="' +
      markersData.data[i].URL +
      '" target="_top">' +
      markersData.data[i].name +
      "</a></b>";
    let marker = L.marker([markersData.data[i].y, markersData.data[i].x], {
      icon: markerTypeIcon,
    }).bindPopup(markerHTML);

    allMarkers.push(marker);
  }

  let settlementsGroup = L.layerGroup(allMarkers);
  settlementsLayer.addLayer(settlementsGroup);
  settlementsLayer.addTo(map);
  layerControl.addOverlay(settlementsLayer, "Points of interest");
}

map.on("zoomend", function () {
  if (map.getZoom() < 7) {
    map.removeLayer(settlementsLayer);
  } else {
    map.addLayer(settlementsLayer);
  }
});
