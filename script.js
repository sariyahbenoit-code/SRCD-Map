mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    zoom: 17, // zoomed out more
    center: [-122.51465, 37.96558],
    pitch: 60,
    antialias: true
});

map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');

// 3D model points with labels
const modelPoints = [
    {
        coords: [-122.5115, 37.9675],
        model: "assets/images/pond_pack.glb",
        label: "Solar Powered Forebay and Extended Marsh Edge"
    },
    {
        coords: [-122.537464, 37.984078],
        model: "assets/images/bench.glb",
        label: "Multipurpose seating"
    },
    {
        coords: [-122.477353, 37.984108],
        model: "assets/images/closet.glb",
        label: "Storage units converted into Emergency Supply Inventory"
    }
];

let featureData = null;

// Load geojson
fetch('data/619data.geojson')
    .then(res => res.json())
    .then(data => { featureData = data; initializeMap(); });

function initializeMap() {
    map.on('load', () => {
        map.addSource("landmarks", { type: "geojson", data: featureData });

        map.addLayer({
            id: "landmarks-layer",
            type: "circle",
            source: "landmarks",
            paint: {
                "circle-radius": 0,
                "circle-color": "#ffffff",
                "circle-opacity": 0
            }
        });

        add3DModels();
    });
}

function add3DModels() {
    const THREE = window.THREE;
    const labels = [];

    modelPoints.forEach((point, idx) => {
        const mc = mapboxgl.MercatorCoordinate.fromLngLat(point.coords, 0);
        const scale = mc.meterInMercatorCoordinateUnits() * 50;

        const scene = new THREE.Scene();
        const camera = new THREE.Camera();
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(map.getCanvas().width, map.getCanvas().height);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(renderer.domElement);

        const light1 = new THREE.DirectionalLight(0xffffff, 1);
        light1.position.set(0, -70, 100).normalize();
        scene.add(light1);
        const light2 = new THREE.DirectionalLight(0xffffff, 1);
        light2.position.set(0, 70, 100).normalize();
        scene.add(light2);

        const loader = new THREE.GLTFLoader();
        let model;
        loader.load(point.model, gltf => {
            model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.position.set(mc.x, mc.y, mc.z);
            scene.add(model);
        });

        const label = document.createElement('div');
        label.className = 'model-label';
        label.textContent = point.label;
        document.body.appendChild(label);
        labels.push({ label, coords: point.coords });

        map.on('render', () => {
            if (!model) return;
            renderer.render(scene, camera);

            labels.forEach(l => {
                const pos = map.project(l.coords);
                l.label.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            });
        });

        // Click event for 3D models
        renderer.domElement.addEventListener('click', e => {
            // Find the nearest feature from geojson by distance
            if (!featureData) return;
            let closestFeature = null;
            let minDist = Infinity;
            featureData.features.forEach(f => {
                const lng = f.geometry.coordinates[0];
                const lat = f.geometry.coordinates[1];
                const dist = Math.sqrt(Math.pow(lat - point.coords[1], 2) + Math.pow(lng - point.coords[0], 2));
                if (dist < minDist) {
                    minDist = dist;
                    closestFeature = f;
                }
            });

            if (!closestFeature) return;

            const props = closestFeature.properties;
            const html = `
                <h3>${props.title || 'No Title'}</h3>
                ${props.address ? `<p><strong>Address:</strong> ${props.address}</p>` : ''}
                ${props.proposal ? `<p>${props.proposal}</p>` : ''}
                <p><strong>Coordinates:</strong> ${point.coords[1].toFixed(5)}, ${point.coords[0].toFixed(5)}</p>
            `;
            new mapboxgl.Popup().setLngLat(point.coords).setHTML(html).addTo(map);
            document.getElementById('featureInfo').innerHTML = html;
        });
    });
}

// Layer toggles
document.getElementById('toggle3D').addEventListener('change', e => {
    const visible = e.target.checked;
    document.querySelectorAll('canvas').forEach(c => c.style.display = visible ? 'block' : 'none');
});
document.getElementById('toggleLabels').addEventListener('change', e => {
    const visible = e.target.checked;
    document.querySelectorAll('.model-label').forEach(l => l.style.display = visible ? 'block' : 'none');
});
