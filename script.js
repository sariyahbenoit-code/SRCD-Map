mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.5125, 37.9679],
    zoom: 12.5,
    pitch: 60,
    bearing: 0,
    antialias: true
});

const modelData = [
    {
        coords: [-122.5115, 37.9675],
        glb: 'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/pond_pack.glb',
        label: 'Solar Powered Forebay and Extended Marsh Edge'
    },
    {
        coords: [-122.5374, 37.9841],
        glb: 'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/bench.glb',
        label: 'Multipurpose seating'
    },
    {
        coords: [-122.5036, 37.972],
        glb: 'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/closet.glb',
        label: 'Storage units converted into Emergency Supply Inventory'
    }
];

let labels = [];

map.on('load', async () => {
    const geojson = await fetch('https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson')
        .then(r => r.json());

    const THREE = window.THREE;

    const customLayer = {
        id: '3d-models',
        type: 'custom',
        renderingMode: '3d',

        onAdd: function(map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            const L1 = new THREE.DirectionalLight(0xffffff, 0.8);
            L1.position.set(0, -70, 100).normalize();
            this.scene.add(L1);

            const L2 = new THREE.DirectionalLight(0xffffff, 0.6);
            L2.position.set(0, 70, 100).normalize();
            this.scene.add(L2);

            this.renderer = new THREE.WebGLRenderer({ alpha: true });
            this.renderer.autoClear = false;
            this.renderer.setSize(map.getCanvas().width, map.getCanvas().height);

            this.models = [];

            const loader = new THREE.GLTFLoader();

            modelData.forEach((m, index) => {
                loader.load(m.glb, (gltf) => {
                    const model = gltf.scene;

                    const merc = mapboxgl.MercatorCoordinate.fromLngLat(m.coords, 0);
                    const scale = merc.meterInMercatorCoordinateUnits();

                    model.scale.set(scale * 0.05, scale * 0.05, scale * 0.05);
                    model.position.set(merc.x, merc.y, merc.z);

                    this.scene.add(model);
                    this.models.push({
                        mesh: model,
                        data: geojson.features[index],
                        label: m.label,
                        coords: m.coords
                    });

                    const div = document.createElement('div');
                    div.className = 'model-label';
                    div.innerText = m.label;
                    document.body.appendChild(div);
                    labels.push({ div, coords: m.coords });
                });
            });
        },

        render: function(gl, matrix) {
            this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
            this.renderer.state.reset();
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();

            labels.forEach(l => {
                const p = map.project(l.coords);
                l.div.style.left = p.x + 'px';
                l.div.style.top = p.y + 'px';
            });
        }
    };

    map.addLayer(customLayer);

    map.on('click', (e) => {
        const mouse = [e.lngLat.lng, e.lngLat.lat];
        let clicked = null;

        if (customLayer.models) {
            customLayer.models.forEach(m => {
                const d = Math.sqrt((mouse[0] - m.coords[0])**2 + (mouse[1] - m.coords[1])**2);
                if (d < 0.001) clicked = m;
            });
        }

        if (clicked) {
            const props = clicked.data.properties;
            const html = `
                <h3>${props.title || clicked.label}</h3>
                <p><strong>Address:</strong> ${props.address || 'N/A'}</p>
                <p>${props.proposal || 'N/A'}</p>
                <p><strong>Coordinates:</strong> ${clicked.coords[1].toFixed(6)}, ${clicked.coords[0].toFixed(6)}</p>
            `;
            new mapboxgl.Popup().setLngLat(clicked.coords).setHTML(html).addTo(map);
            document.getElementById('feature-info').innerHTML = html;
        }
    });

    document.getElementById('toggle-models').addEventListener('change', (e) => {
        if (customLayer.scene) customLayer.scene.visible = e.target.checked;
    });

    document.getElementById('toggle-labels').addEventListener('change', (e) => {
        labels.forEach(l => l.div.style.display = e.target.checked ? 'block' : 'none');
    });
});
