var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('../images/map.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);