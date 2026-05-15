var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('../images/mapv1/{z}/{x}/{y}.png', {
    maxZoom: 4,
    attribution: '&copy; <a href="https://nuradan.flygohr.com">Nuradan Project</a>'
}).addTo(map);