
mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";


const SRCD_CENTER = [-122.514522, 37.967155];


const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: SRCD_CENTER,
    zoom: 17,
    pitch: 60,
    bearing: -20,
    antialias: true
});


const gl = map.getCanvas().getContext("webgl", { antialias: true });

const renderer = new THREE.WebGLRenderer({
    canvas: map.getCanvas(),
    context: gl,
    antialias: true,
    alpha: true
});
renderer.autoClear = false;

const scene = new THREE.Scene();
const camera = new THREE.Camera();

const loader = new THREE.GLTFLoader();


const modelAssignments = [
    {
        name: "Solar Powered Forebay & Marsh (South)",
        coords: [-122.51465, 37.96690],
        glb: "assets/images/pond_pack.glb"
    },
    {
        name: "Modular Multi-purpose Bench Stove (NW)",
        coords: [-122.51510, 37.96765],
        glb: "assets/images/bench.glb"
    },
    {
        name: "Storage Units for Emergency Inventory (NE)",
        coords: [-122.51400, 37.96770],
        glb: "assets/images/closet.glb"
    }
];


function lngLatToVector(lng, lat) {
    const mc = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
    return new THREE.Vector3(mc.x, mc.y, mc.z);
}


map.on("load", () => {

    modelAssignments.forEach(item => {
        loader.load(item.glb, gltf => {
            const model = gltf.scene;

            const v = lngLatToVector(item.coords[0], item.coords[1]);

            model.position.copy(v);
            model.scale.set(5, 5, 5);
            model.rotation.x = Math.PI / 2;

            scene.add(model);
        });
    });
});



map.on("render", () => {
    renderer.state.reset();
    renderer.render(scene, camera);
});



document.getElementById("zoomRegion").addEventListener("click", () => {
    map.flyTo({
        center: SRCD_CENTER,
        zoom: 6,
        pitch: 60,
        bearing: -20,
        speed: 0.7
    });
});

document.getElementById("resetView").addEventListener("click", () => {
    map.flyTo({
        center: SRCD_CENTER,
        zoom: 17,
        pitch: 60,
        bearing: -20,
        speed: 0.7
    });
});
