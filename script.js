

mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

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

const modelData = [
    {
        id: 'pond-model',
        coords: [-122.51465, 37.96690],
        url: 'assets/images/pond_pack.glb',
        visible: true
    },
    {
        id: 'bench-model',
        coords: [-122.51510, 37.96765],
        url: 'assets/images/bench.glb',
        visible: true
    },
    {
        id: 'closet-model',
        coords: [-122.51400, 37.96770],
        url: 'assets/images/closet.glb',
        visible: true
    }
];

let THREEJS; 
const loadedModels = []; 

map.on('load', async () => {
    THREEJS = window.THREE;


    const customLayer = {
        id: 'srcd-3d-models',
        type: 'custom',
        renderingMode: '3d',

        onAdd: function (mapInstance, gl) {
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

                        const scaleFactor = merc.meterInMercatorCoordinateUnits();

                        const desiredScaleMeters = 1; 
                        model.scale.set(scaleFactor * 0.05, scaleFactor * 0.05, scaleFactor * 0.05);

                        model.position.set(merc.x, merc.y, merc.z);

                        model.rotation.x = Math.PI / 2;

                        loadedModels.push({
                            id: m.id,
                            mesh: model,
                            data: m
                        });

                        this.scene.add(model);
                    },
                    undefined,
                    (err) => console.error('GLTF load error:', m.url, err)
                );
            });
        },

        render: function (gl, matrix) {
            this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

            this.renderer.state.reset();
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);

    const pondCheckbox = document.getElementById('togglePond');
    const benchCheckbox = document.getElementById('toggleBench');
    const closetCheckbox = document.getElementById('toggleCloset');

    function setModelVisibilityById(id, visible) {
        const entry = loadedModels.find(l => l.id === id);
        if (entry && entry.mesh) entry.mesh.visible = visible;
    }

    if (pondCheckbox) {
        pondCheckbox.addEventListener('change', (e) => {
            setModelVisibilityById('pond-model', e.target.checked);
        });
    }
    if (benchCheckbox) {
        benchCheckbox.addEventListener('change', (e) => {
            setModelVisibilityById('bench-model', e.target.checked);
        });
    }
    if (closetCheckbox) {
        closetCheckbox.addEventListener('change', (e) => {
            setModelVisibilityById('closet-model', e.target.checked);
        });
    }

    if (pondCheckbox) pondCheckbox.checked = modelData[0].visible;
    if (benchCheckbox) benchCheckbox.checked = modelData[1].visible;
    if (closetCheckbox) closetCheckbox.checked = modelData[2].visible;
});

const zoomRegionBtn = document.getElementById('zoomRegion');
const resetViewBtn = document.getElementById('resetView');

if (zoomRegionBtn) {
    zoomRegionBtn.addEventListener('click', () => {
        map.flyTo({
            center: SRCD_CENTER,
            zoom: Math.max(1, (map.getZoom() - 5)), 
            pitch: 60,
            bearing: -20,
            speed: 0.8
        });
    });
}

if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
        map.flyTo({
            center: SRCD_CENTER,
            zoom: 17,
            pitch: 60,
            bearing: -20,
            speed: 0.8
        });
    });
}
