mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: { basemap: { theme: "monochrome" } },
    center: [-122.513922, 37.966597],
    zoom: 17.5,
    pitch: 60,
    antialias: true
});

function addModel(id, url, coords) {
  map.addLayer({
    id: id,
    type: "model",
    source: {
      type: "model",
      url: url
    },
    layout: { visibility: "none" },
    paint: {
      "model-scale": [1, 1, 1],
      "model-rotation": [0, 0, 0],
      "model-translation": [0, 0, 0],
      "model-opacity": 1
    },
    coordinates: coords
  });
}

map.on("load", () => {
  addModel("pondModel", "assets/images/pond_pack.glb", [-122.5155, 37.9685]); // SOUTH
  addModel("benchModel", "assets/images/bench.glb", [-122.5205, 37.9765]); // NW
  addModel("closetModel", "assets/images/closet.glb", [-122.5105, 37.9780]); // NE
});

document.getElementById("togglePond").addEventListener("change", e =>
  map.setLayoutProperty("pondModel", "visibility", e.target.checked ? "visible" : "none")
);

document.getElementById("toggleBench").addEventListener("change", e =>
  map.setLayoutProperty("benchModel", "visibility", e.target.checked ? "visible" : "none")
);

document.getElementById("toggleCloset").addEventListener("change", e =>
  map.setLayoutProperty("closetModel", "visibility", e.target.checked ? "visible" : "none")
);

document.getElementById("zoomRegion").onclick = () => {
  map.flyTo({
    center: [-122.515, 37.972],
    zoom: 14.2,
    pitch: 60,
    bearing: 20
  });
};

document.getElementById("resetView").onclick = () => {
  map.flyTo({
    center: [-122.5155, 37.9735],
    zoom: 13,
    pitch: 60,
    bearing: 20
  });
};
