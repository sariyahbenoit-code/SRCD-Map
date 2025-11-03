<script src='https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js'></script>
<script src="./script.js"></script>
mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'https://api.mapbox.com/styles/v1/snbenoi/cmhjgr9hh000001rcf6cy38p0.html?title=view&access_token=pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA&zoomwheel=true&fresh=true#2/38/-34'
    center: [-122.51254929752972,37.967891090496614], // starting position [lng, lat]. Note that lat must be set between -90 and 90
    zoom: 9 // starting zoom
      });