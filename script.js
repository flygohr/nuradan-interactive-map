//Creating the Map

let params = {};
window.location.href.replace(
  /[?&]+([^=&]+)=([^&]*)/gi,
  function (m, key, value) {
    params[key] = value;
  },
);

let debugMode = false;
let zonesVisible = true;

if (params.debug == "true") {
  debugMode = true;
}

if (params.zones == "false") {
  zonesVisible = false;
}

let tilesH = 44;
let tilesW = 78;
let tileSize = 256;
let maxZoom = 8;

// avoid URL passing zoom breaking parameters

if (params.zoom < 4) {
  params.zoom = 4
}

if (params.zoom > 8) {
  params.zoom = 8
}

if (params.lat > 0) {
  params.lat = 0
} 

if (params.lat < -tilesW) {
  params.lat = -tilesW
}

if (params.lng < 0) {
  params.lng = 0
} 

if (params.lng > tilesW) {
  params.lng = tilesW
}

let map = L.map("map", {
  crs: L.CRS.Simple,
  center: [params.lat || -22, params.lng || 39],
  zoom: params.zoom || 7,
});

let sw = map.unproject([0, tilesH * tileSize], maxZoom);
let ne = map.unproject([tilesW * tileSize, 0], maxZoom);
let bounds = L.latLngBounds(sw, ne);
let gridSize = tileSize / 8;
let gridW = (tileSize * tilesW) / gridSize;
let gridH = (tileSize * tilesH) / gridSize;
let gridSizeCRS = tilesW / gridW;

// console.log(gridSizeCRS) // 0.125, or grid step size for mapping grid purposes

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

// let zones_overlay = L.tileLayer("images/zones/{z}/{x}/{y}.png", {
//   maxNativeZoom: 8,
//   minNativeZoom: 5,
//   minZoom: 6,
//   maxZoom: 8,
//   noWrap: true,
//   bounds: bounds,
// });

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

let layerControl = L.control.layers(null, null);
layerControl.addTo(map);
// if (debugMode == true) {
  // layerControl.addTo(map);
// }

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

let zonesLayer = new L.FeatureGroup();

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
      { color: "#E6D8AB", weight: 1, opacity: 0.6, fillOpacity: 0.15 },
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

  let zone_boundaries = L.layerGroup(zonesRectangles);
  zonesLayer.addLayer(zone_boundaries);

  if (zonesVisible == true & map.getZoom() > 7) {
    zonesLayer.addTo(map); // when I sort out the controlLayers I'll be able to take advantage of this
  }
  // layerControl.addOverlay(zonesLayer, "Zones overlay");
}

// layerControl.addOverlay(zones_overlay, "Debug: zone boundaries");
if (debugMode == true) {
  layerControl.addOverlay(coordinatesGridGroup, "Debug: coordinates grid");
}

// TODO: add hover effects

map.setMaxBounds(bounds);

let NuradanIconSmall = L.Icon.extend({
  options: {
    shadowUrl: "images/icons/64/shadow.png",
    iconSize: [32, 32],
    shadowSize: [32, 32],
    iconAnchor: [16, 30],
    popupAnchor: [0, -30],
  },
});

let NuradanIconLarge = L.Icon.extend({
  options: {
    shadowUrl: "images/icons/128/shadow.png",
    iconSize: [64, 64],
    shadowSize: [64, 64],
    iconAnchor: [32, 60],
    popupAnchor: [0, -60],
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
let regionIcon = new NuradanIconLarge({
  iconUrl: "images/icons/128/region.png",
});

if (debugMode == true) {
  //Coordinate Finder
  let marker = L.marker([-16.320367, 48.311807], {
    icon: markerIcon,
    draggable: true,
  }).addTo(map);
  marker.bindPopup("Move to show coordinates");
  marker.on("dragend", function (e) {
    let cellLat = Math.trunc(marker.getLatLng().lat / gridSizeCRS);
    let cellLng = Math.trunc(marker.getLatLng().lng / gridSizeCRS);
    console.log(marker.getLatLng());
    let preciseCoords = marker.getLatLng().toString();
    let popupString =
      cellLat +
      "<br />" +
      cellLng +
      "<br /><br />" +
      marker.getLatLng().lat +
      "<br />" +
      marker.getLatLng().lng;
    marker.getPopup().setContent(popupString).openOn(map);
  });
}

//Markers
let landmarksLayer = new L.FeatureGroup();
let regionsLayer = new L.FeatureGroup();

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
  let regionMarkers = [];

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
      case "region":
        markerTypeIcon = regionIcon;
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

    if (markersData.data[i].type == "region") {
      regionMarkers.push(marker);
    } else allMarkers.push(marker);
  }

  let regionsGroup = L.layerGroup(regionMarkers);
  regionsLayer.addLayer(regionsGroup);
  if (map.getZoom() > 4 & map.getZoom() < 6) {
    regionsLayer.addTo(map);
  }
  // layerControl.addOverlay(regionsLayer, "Regions");

  let landmarksGroup = L.layerGroup(allMarkers);
  landmarksLayer.addLayer(landmarksGroup);
  if (map.getZoom() > 6) {
    landmarksLayer.addTo(map);
  }
  // layerControl.addOverlay(landmarksLayer, "Points of interest");
}

displayLevels(map.getZoom())

map.on("load", function () {
  displayLevels(map.getZoom());
});

map.on("zoomend", function () {
  displayLevels(map.getZoom());
});

function displayLevels(zoomLevel) {
  switch (zoomLevel) {
    case 4:

      if (debugMode == false) {
        layerControl.remove()
      }

      map.removeLayer(regionsLayer);
      layerControl.removeLayer(regionsLayer)

      map.removeLayer(landmarksLayer);
      layerControl.removeLayer(landmarksLayer)

      map.removeLayer(zonesLayer);
      layerControl.removeLayer(zonesLayer)

      break;
    case 5:

      if (debugMode == false) {
        layerControl.addTo(map)
      }

      map.removeLayer(regionsLayer);
      layerControl.removeLayer(regionsLayer)

      map.removeLayer(landmarksLayer);
      layerControl.removeLayer(landmarksLayer)

      map.removeLayer(zonesLayer);
      layerControl.removeLayer(zonesLayer)
      
      map.addLayer(regionsLayer);
      layerControl.addOverlay(regionsLayer, "Region markers")

      break;
    case 6:

      if (debugMode == false) {
        layerControl.addTo(map)
      }

      map.removeLayer(regionsLayer);
      layerControl.removeLayer(regionsLayer)

      map.removeLayer(landmarksLayer);
      layerControl.removeLayer(landmarksLayer)

      map.removeLayer(zonesLayer);
      layerControl.removeLayer(zonesLayer)
      
      map.addLayer(regionsLayer);
      layerControl.addOverlay(regionsLayer, "Region markers")

      break;
    case 7:

      if (debugMode == false) {
        layerControl.addTo(map)
      }

      map.removeLayer(regionsLayer);
      layerControl.removeLayer(regionsLayer)

      map.removeLayer(landmarksLayer);
      layerControl.removeLayer(landmarksLayer)

      map.removeLayer(zonesLayer);
      layerControl.removeLayer(zonesLayer)

      map.addLayer(landmarksLayer);
      layerControl.addOverlay(landmarksLayer, "Points of interest");
      
      break;
    case 8:

      if (debugMode == false) {
        layerControl.addTo(map)
      }

      map.removeLayer(regionsLayer);
      layerControl.removeLayer(regionsLayer)

      map.removeLayer(landmarksLayer);
      layerControl.removeLayer(landmarksLayer)

      map.removeLayer(zonesLayer);
      layerControl.removeLayer(zonesLayer)

      map.addLayer(landmarksLayer);
      layerControl.addOverlay(landmarksLayer, "Points of interest");

      map.addLayer(zonesLayer);
      layerControl.addOverlay(zonesLayer, "Zone boundaries");

      break;
  }
}
