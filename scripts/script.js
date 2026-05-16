var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('../images/mapv2/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://nuradan.flygohr.com">Nuradan Project</a>'
}).addTo(map);