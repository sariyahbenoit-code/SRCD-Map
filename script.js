

mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-70.9286, 42.2330], 
    zoom: 16
});

let scene, camera, renderer;

function initThreeJS() {
    const container = document.getElementById('three-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function loadGLB(path, position, scale = 1) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        path,
        function (gltf) {
            const model = gltf.scene;
            model.position.set(position.x, position.y, position.z);
            model.scale.set(scale, scale, scale);
            scene.add(model);
        },
        undefined,
        function (error) {
            console.error("Error loading GLB:", error);
        }
    );
}


const modelAssignments = [
    {
        name: "Solar Powered Forebay & Marsh (South)",
        coords: [-70.92802, 42.23248],
        glb: "assets/images/pond_pack.glb"
    },
    {
        name: "Modular Multi-purpose Bench Stove (NW)",
        coords: [-70.92944, 42.23424],
        glb: "assets/images/bench.glb"
    },
    {
        name: "Storage Units for Emergency Inventory (NE)",
        coords: [-70.92766, 42.23416],
        glb: "assets/images/closet.glb"
    }
];



map.on('load', () => {
    initThreeJS();

    modelAssignments.forEach(item => {
        const merc = mapboxgl.MercatorCoordinate.fromLngLat(item.coords, 0);

        loadGLB(item.glb, {
            x: merc.x,
            y: 0,
            z: merc.y
        }, 10);  
    });
});
