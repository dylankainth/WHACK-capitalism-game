// src/ARScene.jsx
import React, { useEffect, useState } from "react";

export default function App() {
  const [aframeReady, setAframeReady] = useState(false);

  useEffect(() => {
    // Wait for A-Frame to be loaded from CDN
    const checkAframe = () => {
      if (window.AFRAME) {
        setAframeReady(true);
      } else {
        setTimeout(checkAframe, 100);
      }
    };
    checkAframe();
  }, []);

  if (!aframeReady) {
    return <div>Loading AR...</div>;
  }

  return (
    <div style={{ margin: 0, overflow: "hidden", width: "100vw", height: "100vh" }}>
      <a-scene
        embedded
        vr-mode-ui="enabled: false"
        arjs="debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceType: webcam; trackingMethod: best; sourceWidth: 1920; sourceHeight: 1080; displayWidth: 1920; displayHeight: 1080;"
        renderer="antialias: true; precision: medium; colorManagement: true;"
      >
        <a-assets timeout="10000">
          <a-asset-item id="tree" src="/models/tree.gltf" />
        </a-assets>

        <a-marker preset="hiro">
          <a-entity
            position="0 0 0"
            rotation="0 0 0"
            scale="0.5 0.5 0.5"
            gltf-model="#tree"
          />
        </a-marker>

        <a-marker type="barcode" value="32">
          <a-entity
            position="0 0 0"
            rotation="0 0 0"
            scale="0.5 0.5 0.5"
            gltf-model="#tree"
          />
        </a-marker>

        <a-marker type="barcode" value="34">
          <a-entity
            position="0 0 0"
            rotation="0 0 0"
            scale="0.5 0.5 0.5"
            gltf-model="#tree"
          />
        </a-marker>

        <a-marker type="barcode" value="36">
          <a-entity
            position="0 0 0"
            rotation="0 0 0"
            scale="0.5 0.5 0.5"
            gltf-model="#tree"
          />
        </a-marker>

        <a-marker type="barcode" value="38">
          <a-entity
            position="0 0 0"
            rotation="0 0 0"
            scale="0.5 0.5 0.5"
            gltf-model="#tree"
          />
        </a-marker>

        <a-entity camera />
      </a-scene>
    </div>
  );
}