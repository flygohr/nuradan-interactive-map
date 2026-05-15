var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('../images/mapv1/{z}/{x}/{y}.png', {
    minZoom: 4,
    maxZoom: 4,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);