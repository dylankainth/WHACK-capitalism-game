export default function App() {
  return (
    <div className="App">
      <h2> React AR JS </h2>
      <div>
        <a-scene
          arjs="debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceType: webcam; sourceWidth: 1920; sourceHeight: 1080; displayWidth: 1920; displayHeight: 1080; trackingMethod: best; minConfidence: 0.0001;"

          renderer="antialias: true; precision: medium; colorManagement: true; ">

          {/* </a-marker> */}
          <a-marker preset="hiro">
            <a-box
              color="#0000FF"
              material="opacity:0.5"
            // animation="property:rotation; from:0 0 0; to:0 360 0; dur:2000; loop:true; dir: alternate;"
            ></a-box>
          </a-marker>

          <a-marker type="barcode" value="30" emitevents="true"
            arjs-anchor="changeMatrixMode: modelViewMatrix;">
            <a-entity
              gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Duck/glTF/Duck.gltf)"
              scale="1 1 1 " ></a-entity>
          </a-marker>





          <a-entity camera>

          </a-entity>
        </a-scene>
      </div>
    </div>
  );
}
