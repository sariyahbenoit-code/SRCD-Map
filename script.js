import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const targetCenter = [-122.514522, 37.967155];

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
      "
