mapboxgl.accessToken = "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-streets-v12",
  center: [-122.5125, 37.9679],
  zoom: 13,
  pitch: 60,
  antialias: true
});

map.on("load", () => {

  const bridgeImageURL = "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/proposal%20for%20a%20bridge.png";

  const bridgeCorners = [
    [-122.533714, 37.980356],
    [-122.463267, 37.980358],
    [-122.463250, 37.953542],
    [-122.533711, 37.953537]
  ];

  map.addSource("bridge-image", {
    type: "image",
    url: bridgeImageURL,
    coordinates: bridgeCorners
  });

  map.addLayer({
    id: "bridge-layer",
    type: "raster",
    source: "bridge-image",
    paint: { "raster-opacity": 1 }
  });

  const landmarks = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          title: "Floating Housing",
          address: "555 Francisco Blvd E, San Rafael, CA 94901",
          proposal: "Floating homes as liveaboard replacement.",
          image: "https://riyahniko.com/wp-content/uploads/2025/11/Screenshot-2025-11-03-at-9.43.05-AM.png"
        },
        geometry: { type: "Point", coordinates: [-122.5036, 37.972] }
      },
      {
        type: "Feature",
        properties: {
          title: "Municipally Leased Storage",
          address: "616 Canal St, San Rafael, CA 94901",
          proposal: "Space for emergency supply storage.",
          image: "https://riyahniko.com/wp-content/uploads/2025/11/Screenshot-2025-11-03-at-9.42.42-AM.png"
        },
        geometry: { type: "Point", coordinates: [-122.5078, 37.9694] }
      },
      {
        type: "Feature",
        properties: {
          title: "Solar Powered Pump Station",
          address: "555 Francisco Blvd W, San Rafael, CA 94901",
          proposal: "Vegetated forebay with solar pumping.",
          image: "https://riyahniko.com/wp-content/uploads/2025/11/fisheye-after-2048x1536.jpeg"
        },
        geometry: { type: "Point", coordinates: [-122.5115, 37.9675] }
      }
    ]
  };

  map.addSource("landmarks", { type: "geojson", data: landmarks });

  map.addLayer({
    id: "landmarks-layer",
    type: "circle",
    source: "landmarks",
    paint: {
      "circle-radius": 8,
      "circle-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#000000"
    }
  });

  map.on("click", "landmarks-layer", (e) => {
    const p = e.features[0].properties;
    const html =
      "<h3>" + p.title + "</h3>" +
      "<p><strong>Address:</strong> " + p.address + "</p>" +
      "<p>" + p.proposal + "</p>" +
      "<img src='" + p.image + "'>";
    new mapboxgl.Popup()
      .setLngLat(e.features[0].geometry.coordinates)
      .setHTML(html)
      .addTo(map);
  });

  map.on("mouseenter", "landmarks-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "landmarks-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  const forebayRect = {
    topLeft: [-122.521122, 37.967225],
    topRight: [-122.519669, 37.967222],
    botLeft: [-122.521122, 37.966491],
    botRight: [-122.519671, 37.966494]
  };

  const modelOrigin = [
    (forebayRect.topLeft[0] + forebayRect.topRight[0]) / 2,
    (forebayRect.topLeft[1] + forebayRect.botLeft[1]) / 2
  ];

  const modelMerc = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, 0);

  const modelTransform = {
    translateX: modelMerc.x,
    translateY: modelMerc.y,
    translateZ: 0,
    scale: modelMerc.meterInMercatorCoordinateUnits()
  };

  const custom3DLayer = {
    id: "forebay-3d",
    type: "custom",
    renderingMode: "3d",

    onAdd: function(map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      const light1 = new THREE.DirectionalLight(0xffffff, 1);
      light1.position.set(10, 10, 50);
      this.scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 1);
      light2.position.set(-10, -10, 50);
      this.scene.add(light2);

      rhino3dm().then((rhino) => {
        const loader = new THREE.ThreeDMLoader();
        loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@7.15.0/");
        loader.load(
          "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/forebay%20shapes.3dm",
          (object) => {
            object.scale.set(0.5, 0.5, 0.5);
            object.rotation.x = Math.PI;
            this.scene.add(object);
          }
        );
      });

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },

    render: function(gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
        .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale));

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      map.triggerRepaint();
    }
  };

  map.addLayer(custom3DLayer);
});
