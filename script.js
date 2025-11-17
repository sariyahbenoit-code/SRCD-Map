/* ----------------------------------------------------
   MAPBOX INITIAL SETUP
---------------------------------------------------- */
mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/snbenoi/cmhjgr9hh000001rcf6cy38p0",
    center: [-122.5125, 37.9679],
    zoom: 13,
    pitch: 60,
    antialias: true
});

/* ----------------------------------------------------
   RASTER IMAGE COORDINATES (YOUR OLD SYSTEM)
---------------------------------------------------- */
const corners = [
  [-122.537464, 37.984078],
  [-122.477353, 37.984108],
  [-122.477370, 37.952203],
  [-122.537475, 37.952208]
];

const underUrl = "assets/images/SFCD underground.jpg";
const surfaceUrl = "assets/images/SRCD surface.jpg";

/* ----------------------------------------------------
   MAP LOAD EVENT
---------------------------------------------------- */
map.on("load", () => {

    /* ----------------------------------------------
       UNDERGROUND RASTER LAYER
    ---------------------------------------------- */
    map.addSource("underground", {
        type: "image",
        url: underUrl,
        coordinates: corners
    });

    map.addLayer({
        id: "underground-layer",
        type: "raster",
        source: "underground",
        paint: { "raster-opacity": 1 }
    });

    /* ----------------------------------------------
       LANDMARK POINTS (YOUR POPUPS)
    ---------------------------------------------- */
    const landmarks = {
        "type": "FeatureCollection",
        "features": [
            {
              "type": "Feature",
              "properties": {
                "title": "Floating Housing",
                "address": "555 Francisco Blvd E",
                "proposal": "Teiger Island floating homes.",
                "image": "https://riyahniko.com/wp-content/uploads/2025/11/Screenshot-2025-11-03-at-9.43.05-AM.png"
              },
              "geometry": { "type": "Point", "coordinates": [-122.5036, 37.9720] }
            },
            {
              "type": "Feature",
              "properties": {
                "title": "Municipal Storage",
                "address": "616 Canal St",
                "proposal": "Emergency supply leasing.",
                "image": "https://riyahniko.com/wp-content/uploads/2025/11/Screenshot-2025-11-03-at-9.42.42-AM.png"
              },
              "geometry": { "type": "Point", "coordinates": [-122.5078, 37.9694] }
            },
            {
              "type": "Feature",
              "properties": {
                "title": "Solar Pump Station",
                "address": "555 Francisco Blvd W",
                "proposal": "Vegetated solar pumping forebay.",
                "image": "https://riyahniko.com/wp-content/uploads/2025/11/fisheye-after-2048x1536.jpeg"
              },
              "geometry": { "type": "Point", "coordinates": [-122.5115, 37.9675] }
            }
        ]
    };

    map.addSource("landmarks", { type:"geojson", data:landmarks });

    map.addLayer({
        id: "landmarks-layer",
        type: "circle",
        source: "landmarks",
        paint: {
            "circle-radius": 8,
            "circle-color": "#fff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#000"
        }
    });

    /* Popup click */
    map.on("click", "landmarks-layer", (e) => {
        const p = e.features[0].properties;
