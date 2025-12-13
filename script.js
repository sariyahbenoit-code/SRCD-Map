import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

// Center of your SRCD area
const targetCenter = [-122.514522, 37.967155];

// Your image points GeoJSON
const imagePoints = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Building entrance",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/building%20entrance.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51403244782145, 37.96782576318992]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Marshland change over time",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/change%20over%20time%20floating.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51354133407277, 37.967894011876524]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Corner park day and night",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park%20day%20night.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51261014782297, 37.96772672087894]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Corner park overview",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.5127367747097, 37.96788480707045]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Fisheye perspective of forebay",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/fisheye%20perspective.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51460483446996, 37.96568378935048]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Floating housing overview",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/floating%20housing.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51426288935914, 37.96621700643947]
      }
    }
  ]
};

// Create the map with Standard style
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  center: targetCenter,
  zoom: 17,
  pitch: 60,
  bearing: 0,
  antialias: true
});

// Apply the monochrome theme once the style is loaded
map.on("style.load", () => {
  map.setConfigProperty("basemap", "theme", "monochrome");
});

map.on("error", (e) => console.error("MAPBOX ERROR:", e.error));

// THREE.js globals
let renderer, scene, camera;

// Loaders
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/libs/draco/"
);
loader.setDRACOLoader(draco);

// Model origins matching your landmarks (lng, lat) - lifted above polygon
const benchOrigin = [-122.5127367747097, 37.96788480707045];   // Corner park overview
const closetOrigin = [-122.51403244782145, 37.96782576318992]; // Building entrance  
const pondOrigin = [-122.51460483446996, 37.96568378935048];   // Fisheye perspective of forebay

const modelAltitude = 5;  // Lift models above polygon surface
const modelRotate = [Math.PI / 2, 0, 0];

function makeTransform(origin) {
  const mc = mapboxgl.MercatorCoordinate.fromLngLat(origin, modelAltitude);
  return {
    translateX: mc.x,
    translateY: mc.y,
    translateZ: mc.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: mc.meterInMercatorCoordinateUnits()
  };
}

const benchTransform = makeTransform(benchOrigin);
const pondTransform = makeTransform(pondOrigin);
const closetTransform = makeTransform(closetOrigin);

// Load a GLB model
async function loadModel(url, scale = 1) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
          }
        });
        gltf.scene.scale.set(scale, scale, scale);
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.error("Error loading model:", url, err);
        reject(err);
      }
    );
  });
}

let benchModel, pondModel, closetModel;
let showBench = true;
let showPond = true;
let showCloset = true;

// Custom 3D layer
const customLayer = {
  id: "3d-model-layer",
  type: "custom",
  renderingMode: "3d",

  onAdd: async function (map, gl) {
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 100, 100);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    renderer.autoClear = false;

    try {
      benchModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/bench.glb",
        1
      );
      scene.add(benchModel);
    } catch (e) {
      console.warn("Bench model not added.");
    }

    try {
      pondModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/pond_pack.glb",
        1
      );
      scene.add(pondModel);
    } catch (e) {
      console.warn("Pond model not added.");
    }

    try {
      closetModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/closet.glb",
        1
      );
      scene.add(closetModel);
    } catch (e) {
      console.warn("Closet model not added.");
    }
  },

  render: (gl, matrix) => {
    if (!renderer || (!pondModel && !closetModel && !benchModel)) return;

    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    renderer.state.reset();
    renderer.autoClear = false;
    renderer.clearDepth();

    function applyTransform(obj, t, mult = 5) {
      if (!obj) return;

      obj.matrixAutoUpdate = false;

      const rotX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        t.rotateX
      );
      const rotY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        t.rotateY
      );
      const rotZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        t.rotateZ
      );

      const translation = new THREE.Matrix4().makeTranslation(
        t.translateX,
        t.translateY,
        t.translateZ
      );

      const s = t.scale * mult;
      const scale = new THREE.Matrix4().makeScale(s, s, s);

      obj.matrix = new THREE.Matrix4()
        .multiply(rotX)
        .multiply(rotY)
        .multiply(rotZ)
        .multiply(scale)
        .multiply(translation);
    }

    applyTransform(benchModel, benchTransform, 5);    // Corner park
    applyTransform(pondModel, pondTransform, 5);      // Forebay pond
    applyTransform(closetModel, closetTransform, 5);  // Building entrance

    if (benchModel) benchModel.visible = showBench;
    if (pondModel) pondModel.visible = showPond;
    if (closetModel) closetModel.visible = showCloset;

    renderer.render(scene, camera);
    map.triggerRepaint();
  }
};

// Load everything once basemap is ready
map.on("load", () => {
  // 1. Add your 3D models layer
  map.addLayer(customLayer);

  // 2. Add your full 619data.geojson as a source
  map.addSource("srcd-geometry", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson"
  });

  // 3. Big polygon (green)
  map.addLayer({
    id: "srcd-polygon-fill",
    type: "fill",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": "#00ff00",
      "fill-opacity": 0.4
    }
  });

  map.addLayer({
    id: "srcd-polygon-outline",
    type: "line",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": "#008800",
      "line-width": 2
    }
  });

  // 4. LineString (red)
  map.addLayer({
    id: "srcd-line",
    type: "line",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "#ff0000",
      "line-width": 3
    }
  });

  // 5. Add your imagePoints as a source
  map.addSource("image-points", {
    type: "geojson",
    data: imagePoints
  });

  // 6. Add a circle layer for the points *AFTER* polygons (on top)
  map.addLayer({
    id: "image-points-layer",
    type: "circle",
    source: "image-points",
    paint: {
      "circle-radius": 6,
      "circle-color": "#ff5500",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff"
    }
  });

  // 7. Popups for image points
  map.on("click", "image-points-layer", (e) => {
    const feature = e.features && e.features[0];
    if (!feature) return;

    const coords = feature.geometry.coordinates.slice();
    const title = feature.properties.Landmark || "";
    const imgUrl = feature.properties.PopupMedia || "";

    const html = `
      <div style="max-width:700px;">
        <h3 style="margin:0 0 6px;font-family:'Roboto Mono',monospace;">${title}</h3>
        <img src="${imgUrl}" alt="${title}" style="max-width:100%;height:auto;display:block;border-radius:4px;margin-top:4px;">
      </div>
    `;

    new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });

  map.on("mouseenter", "image-points-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "image-points-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  // 8. Region zoom buttons
  const regionBounds = [
    [-122.5155, 37.9645], // SW
    [-122.5115, 37.9695]  // NE
  ];

  const zoomRegionBtn = document.getElementById("zoomRegion");
  const resetViewBtn = document.getElementById("resetView");

  if (zoomRegionBtn) {
    zoomRegionBtn.addEventListener("click", () => {
      map.fitBounds(regionBounds, { padding: 40, pitch: 60, bearing: 0 });
    });
  }

  if (resetViewBtn) {
    resetViewBtn.addEventListener("click", () => {
      map.easeTo({
        center: targetCenter,
        zoom: 17,
        pitch: 60,
        bearing: 0
      });
    });
  }

  // 9. Checkbox toggles
  const pondCheckbox = document.getElementById("togglePond");
  const benchCheckbox = document.getElementById("toggleBench");
  const closetCheckbox = document.getElementById("toggleCloset");

  if (pondCheckbox) {
    pondCheckbox.checked = showPond;
    pondCheckbox.addEventListener("change", (e) => {
      showPond = e.target.checked;
      map.triggerRepaint();
    });
  }

  if (benchCheckbox) {
    benchCheckbox.checked = showBench;
    benchCheckbox.addEventListener("change", (e) => {
      showBench = e.target.checked;
      map.triggerRepaint();
    });
  }

  if (closetCheckbox) {
    closetCheckbox.checked = showCloset;
    closetCheckbox.addEventListener("change", (e) => {
      showCloset = e.target.checked;
      map.triggerRepaint();
    });
  }
});
