// -----------------------------
// script.js — updated for correct 3D visibility + working checkboxes
// -----------------------------

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const SRCD_CENTER = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: SRCD_CENTER,
  zoom: 17,
  pitch: 60,
  bearing: -20,
  antialias: true
});

// ------------------------------------------------------------------
// THREE MODEL DEFINITIONS
// ------------------------------------------------------------------
const modelData = [
  {
    id: "pond-model",
    coords: [-122.51465, 37.9669],
    url: "assets/images/pond_pack.glb",
    visible: true
  },
  {
    id: "bench-model",
    coords: [-122.5151, 37.96765],
    url: "assets/images/bench.glb",
    visible: true
  },
  {
    id: "closet-model",
    coords: [-122.514, 37.9677],
    url: "assets/images/closet.glb",
    visible: true
  }
];

let THREEJS;
const loadedModels = [];

// ------------------------------------------------------------------
// MAP LOAD
// ------------------------------------------------------------------
map.on("load", async () => {
  THREEJS = window.THREE;

  // ---------------------------------------------------------------
  // RESTORE MAPBOX 3D BUILDINGS
  // ---------------------------------------------------------------
  const layers = map.getStyle().layers;
  let labelLayerId = null;

  for (const layer of layers) {
    if (layer.type === "symbol" && layer.layout["text-field"]) {
      labelLayerId = layer.id;
      break;
    }
  }

  map.addLayer(
    {
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#aaa",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"]
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"]
        ],
        "fill-extrusion-opacity": 0.6
      }
    },
    labelLayerId
  );

  // ---------------------------------------------------------------
  // ADD CUSTOM THREE.JS LAYER (your objects)
  // ---------------------------------------------------------------
  const customLayer = {
    id: "srcd-3d-models",
    type: "custom",
    renderingMode: "3d",

    onAdd(mapInstance, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      const light1 = new THREE.DirectionalLight(0xffffff, 0.9);
      light1.position.set(0, -70, 100).normalize();
      this.scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
      light2.position.set(0, 70, 100).normalize();
      this.scene.add(light2);

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
        alpha: true
      });
      this.renderer.autoClear = false;

      this.loader = new THREE.GLTFLoader();

      modelData.forEach((m) => {
        this.loader.load(
          m.url,
          (gltf) => {
            const model = gltf.scene;

            const merc = mapboxgl.MercatorCoordinate.fromLngLat(m.coords, 0);
            const scale = merc.meterInMercatorCoordinateUnits();

            model.scale.set(scale * 0.05, scale * 0.05, scale * 0.05);
            model.position.set(merc.x, merc.y, merc.z);
            model.rotation.x = Math.PI / 2;

            model.visible = m.visible;

            loadedModels.push({ id: m.id, mesh: model });
            this.scene.add(model);
          },
          undefined,
          (err) => console.error("GLTF error:", m.url, err)
        );
      });
    },

    render(gl, matrix) {
      this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      map.triggerRepaint();
    }
  };

  // Put 3D objects ABOVE buildings but BELOW point layer
  map.addLayer(customLayer, "3d-buildings");

  // ---------------------------------------------------------------
  // ENSURE POINTS ARE ALWAYS ON TOP
  // ---------------------------------------------------------------
  const pointLayerId = "srcd-points"; // <-- the ID from 12_3
  if (map.getLayer(pointLayerId)) {
    map.moveLayer(pointLayerId);
  }

  // ---------------------------------------------------------------
  // CHECKBOXES CONTROL MODEL VISIBILITY
  // ---------------------------------------------------------------
  function setModelVisibility(id, visible) {
    const entry = loadedModels.find((m) => m.id === id);
    if (entry && entry.mesh) entry.mesh.visible = visible;
  }

  document.getElementById("togglePond")
    .addEventListener("change", (e) =>
      setModelVisibility("pond-model", e.target.checked)
    );

  document.getElementById("toggleBench")
    .addEventListener("change", (e) =>
      setModelVisibility("bench-model", e.target.checked)
    );

  document.getElementById("toggleCloset")
    .addEventListener("change", (e) =>
      setModelVisibility("closet-model", e.target.checked)
    );
});

// ------------------------------------------------------------------
// BUTTON CONTROLS (unchanged)
// ------------------------------------------------------------------
document.getElementById("zoomRegion").addEventListener("click", () => {
  map.flyTo({
    center: SRCD_CENTER,
    zoom: map.getZoom() - 5,
    pitch: 60,
    bearing: -20,
    speed: 0.8
  });
});

document.getElementById("resetView").addEventListener("click", () => {
  map.flyTo({
    center: SRCD_CENTER,
    zoom: 17,
    pitch: 60,
    bearing: -20,
    speed: 0.8
  });
});
