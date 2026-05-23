Link: https://nuradan-interactive-map.vercel.app (temporary)

Command to generate map tiles:

`gdal raster tile --webviewer leaflet --tiling-scheme raster --tile-size 256 --min-zoom=5 --max-zoom=8 map.png layer_folder`

URL parameters:
- `zoom`, integer from 5 to 8
- `debug`, boolean, default `false`, if `true` adds map grid and coords finder marker
- `lat`
- `lng`

Example of URL parameters: `https://nuradan-interactive-map.vercel.app?lat=-16.417943&lng=47.050848&zoom=8&debug=true&zones=false`

It features CSV import using PapaParse. I have one import for zones, and another for landmarks.

Zoom levels:
- at 5, only the map is shown, no markers or zones
- at 6, the region markers show up
- at 7, the region markers go away and all landmarks appear
- at 8, the zone boundaries also appear

Missing:
- layer controls that adapt to zoom changes. I haven't figured out adding and removing options from that control

Resources:
- https://techtrail.net/creating-an-interactive-map-with-leaflet-js/
- https://gdal.org/en/stable/programs/gdal_raster_tile.html#gdal-raster-tile
- https://leafletjs.com/examples.html
- https://www.papaparse.com
- https://blog.mastermaps.com/2012/10/how-to-control-your-leaflet-map-with.html