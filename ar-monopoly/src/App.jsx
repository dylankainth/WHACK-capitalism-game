export default function App() {
  return (
    <div className="App">
      <h2> React AR JS </h2>
      <div>
        <a-scene
          arjs="debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceType: webcam;" >

          {/* </a-marker> */}
          <a-marker preset="hiro">
            <a-box
              color="#0000FF"
              material="opacity:0.5"
            // animation="property:rotation; from:0 0 0; to:0 360 0; dur:2000; loop:true; dir: alternate;"
            ></a-box>
          </a-marker>

          <a-marker type="barcode" value="32">
            <a-box
              color="#FF0000"
              material="opacity:0.5"
            // animation="property:rotation; from:0 0 0; to:0 360 0; dur:2000; loop:true; dir: alternate;"
            ></a-box>
            {/* <a-entity position="0 0 0" rotation="0 0 0" scale="0.10 0.10 0.10" gltf-model="/models/tree.gltf"></a-entity> */}
          </a-marker>

          <a-entity camera>

          </a-entity>
        </a-scene>
      </div>
    </div>
  );
}
