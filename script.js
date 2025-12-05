// ================================
// GLOBAL MODEL SCALE FACTOR
// ================================
// Reduce this number to shrink all GLBs. Increase to enlarge.
// 1.0 = current size, 0.2 = 1/5 smaller, etc.
const MODEL_SCALE_FACTOR = 1.0;


// ================================
// MAP INITIALIZATION (UNCHANGED)
// ================================
mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: { basemap: { theme: "monochrome" }},
    zoom: 18,
    center: [-122.514522, 37.967155],
    pitch: 60,
    antialias: true
});

const pointsURL =
    "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson";

const MODEL_URLS = {
    pond: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/pond_pack.glb",
    bench: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/bench.glb",
    closet: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/closet.glb"
};

const loadedModels = {};

function sameCoord(a, b, tol = 1e-6) {
    return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
}

// ================================
// MAIN ENTRY: style.load
// ================================
map.on("style.load", async () => {

    add3DBuildings();

    const resp = await fetch(pointsURL);
    const geojson = await resp.json();

    addModelsFromGeoJSON(geojson);
    addPointsLayer(geojson);
    setupToggles();
});

// ================================
// 3D BUILDINGS
// ================================
function add3DBuildings() {
    try {
        map.addSource("composite", {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8"
        });

        map.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "height"]
                ],
                "fill-extrusion-base": [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.6
            }
        });
    } catch (err) {}
}

// ================================
// ADD MODELS — WITH GLOBAL SCALE VARIABLE
// ================================
async function addModelsFromGeoJSON(geojson) {

    const known = {
        pond: [-122.5146472, 37.9656917],
        bench: [-122.51255653080607, 37.96784675899259],
        closet: [-122.51172577538132, 37.96756766223187]
    };

    const loader = new THREE.GLTFLoader();

    for (const feature of geojson.features) {
        const coords = feature.geometry.coordinates;
        let key = null;

        if (sameCoord(coords, known.pond)) key = "pond";
        else if (sameCoord(coords, known.bench)) key = "bench";
        else if (sameCoord(coords, known.closet)) key = "closet";
        else continue;

        const modelUrl = MODEL_URLS[key];
        const layerId = `model-${key}`;

        const mc = mapboxgl.MercatorCoordinate.fromLngLat(coords, 0);

        const customLayer = {
            id: layerId,
            type: "custom",
            renderingMode: "3d",

            onAdd: function (mapInstance, gl) {
                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();

                // lighting (unchanged)
                const sun = new THREE.DirectionalLight(0xffffff, 1.5);
                sun.position.set(150, 200, 300);
                this.scene.add(sun);

                const fill = new THREE.AmbientLight(0xffffff, 0.7);
                this.scene.add(fill);

                loader.load(modelUrl, (gltf) => {
                    const model = gltf.scene;

                    // base conversion
                    const base = mc.meterInMercatorCoordinateUnits();

                    // 🎯 apply global scale variable
                    const scale = base * 20 * MODEL_SCALE_FACTOR;

                    model.scale.set(scale, scale, scale);

                    model.rotation.x = Math.PI / 2;
                    model.position.set(0, 0, 0);

                    loadedModels[key] = { mesh: model, layerId };
                    this.scene.add(model);
                });

                this.renderer = new THREE.WebGLRenderer({
                    canvas: mapInstance.getCanvas(),
                    context: gl,
                    antialias: true
                });
                this.renderer.autoClear = false;
            },

            render: function (gl, matrix) {
                const m = new THREE.Matrix4().fromArray(matrix);

                const trans = new THREE.Matrix4()
                    .makeTranslation(mc.x, mc.y, mc.z);

                this.camera.projectionMatrix = m.multiply(trans);

                this.renderer.state.reset();
                this.renderer.render(this.scene, this.camera);
                map.triggerRepaint();
            }
        };

        map.addLayer(customLayer);
    }
}

// ================================
// POINTS LAYER
// ================================
function addPointsLayer(geojson) {
    if (!map.getSource("points")) {
        map.addSource("points", { type: "geojson", data: geojson });
    }

    map.addLayer({
        id: "point-circles",
        type: "circle",
        source: "points",
        paint: {
            "circle-radius": 8,
            "circle-color": "#ff5500",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
        }
    });
}

// ================================
// CHECKBOX TOGGLES
// ================================
function setupToggles() {
    const pondBox = document.getElementById("togglePond");
    const benchBox = document.getElementById("toggleBench");
    const closetBox = document.getElementById("toggleCloset");

    pondBox.onchange = e => {
        if (loadedModels.pond) loadedModels.pond.mesh.visible = e.target.checked;
    };
    benchBox.onchange = e => {
        if (loadedModels.bench) loadedModels.bench.mesh.visible = e.target.checked;
    };
    closetBox.onchange = e => {
        if (loadedModels.closet) loadedModels.closet.mesh.visible = e.target.checked;
    };
}

// ================================
// BUTTONS (unchanged)
// ================================
document.getElementById("zoomRegion").onclick = () =>
    map.flyTo({
        center: [-122.514522, 37.967155],
        zoom: 15.5,
        pitch: 60,
        bearing: -20,
        speed: 0.8
    });

document.getElementById("resetView").onclick = () =>
    map.flyTo({
        center: [-122.514522, 37.967155],
        zoom: 18,
        pitch: 60,
        bearing: -20,
        speed: 0.8
    });
