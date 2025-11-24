const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    config: { basemap: { theme: 'monochrome' }},
    zoom: 12,
    center: [-122.51465, 37.96558],
    pitch: 60,
    antialias: true
});

fetch("data/619data.geojson")
.then(response => response.json())
.then(geojson => {
    map.on("load", () => {
        map.addSource("sites", { type: "geojson", data: geojson });

        map.addLayer({
            id: "sites-points",
            type: "circle",
            source: "sites",
            paint: {
                "circle-radius": 6,
                "circle-color": "#ff5500"
            }
        });

        map.on("mouseenter", "sites-points", () => {
            map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "sites-points", () => {
            map.getCanvas().style.cursor = "";
        });

        map.on("click", "sites-points", e => {
            const coords = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;
            const content = `<h3>${props.name || "Site"}</h3><p>${props.description || ""}</p>`;
            new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
                .setLngLat(coords)
                .setHTML(content)
                .addTo(map);
        });

        geojson.features.forEach((feature, index) => {
            add3DModelAtPoint(feature, index);
        });
    });
});

function add3DModelAtPoint(feature, index) {
    const lngLat = feature.geometry.coordinates;
    const mc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0);
    const rotation = [Math.PI / 2, 0, 0];

    const transform = {
        translateX: mc.x,
        translateY: mc.y,
        translateZ: mc.z,
        rotateX: rotation[0],
        rotateY: rotation[1],
        rotateZ: rotation[2],
        scale: mc.meterInMercatorCoordinateUnits()
    };

    const layerID = "3d-model-" + index;

    const customLayer = {
        id: layerID,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();
            const light1 = new THREE.DirectionalLight(0xffffff);
            light1.position.set(0, -70, 100).normalize();
            this.scene.add(light1);
            const lig
