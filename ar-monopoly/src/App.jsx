import { useEffect, useRef } from "react";
export default function App() {
  const sceneRef = useRef(null);
  const planeRef = useRef(null);

  useEffect(() => {
    const { THREE } = window;
    if (!THREE) {
      console.warn("THREE.js not available on window; plane will not be created.");
      return;
    }

    const scene = document.querySelector("a-scene");

    // Helper: fetch marker elements
    const markers = [
      document.querySelector("#marker32"),
      document.querySelector("#marker34"),
      document.querySelector("#marker36"),
      document.querySelector("#marker38"),
    ];

    // Create plane geometry and material
    const geometry = new THREE.PlaneGeometry(1, 1); // initial size, will scale
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      opacity: 0.5,
      transparent: true,
    });
    const plane = new THREE.Mesh(geometry, material);
    planeRef.current = plane;

    // Create debug line for p32->p38 (bottom edge)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const lineGeometry = new THREE.BufferGeometry();
    const debugLine = new THREE.Line(lineGeometry, lineMaterial);

    // Add plane and line to the A-Frame scene
    scene.object3D.add(plane);
    scene.object3D.add(debugLine);

    // Update function called each frame
    const updatePlane = () => {
      const allVisible = markers.every((m) => m && m.object3D.visible);
      if (!allVisible) {
        plane.visible = false;
        requestAnimationFrame(updatePlane);
        return;
      }

      plane.visible = true;

      const [marker32, marker34, marker36, marker38] = markers;
      const p32 = new THREE.Vector3().setFromMatrixPosition(marker32.object3D.matrixWorld);
      const p34 = new THREE.Vector3().setFromMatrixPosition(marker34.object3D.matrixWorld);
      const p36 = new THREE.Vector3().setFromMatrixPosition(marker36.object3D.matrixWorld);
      const p38 = new THREE.Vector3().setFromMatrixPosition(marker38.object3D.matrixWorld);

      console.log("Marker positions:", { p32, p34, p36, p38 });
      // Corner layout: 34 (top-left), 36 (top-right), 38 (bottom-left), 32 (bottom-right)
      const xDir = new THREE.Vector3().subVectors(p36, p34); // top edge direction from left to right
      const yDir = new THREE.Vector3().subVectors(p36, p32); // left edge direction from top to bottom

      const topWidth = xDir.length();
      const bottomWidth = new THREE.Vector3().subVectors(p32, p38).length();
      const leftHeight = yDir.length();
      const rightHeight = new THREE.Vector3().subVectors(p36, p32).length();

      const width = (topWidth + bottomWidth) / 2;
      const height = (leftHeight + rightHeight) / 2;

      if (width === 0 || height === 0) {
        requestAnimationFrame(updatePlane);
        return;
      }

      const xAxis = xDir.clone().normalize();
      const yAxis = yDir.clone().normalize();

      // Ensure orthogonality by removing any component of y along x
      const projection = xAxis.clone().multiplyScalar(yAxis.dot(xAxis));
      yAxis.sub(projection).normalize();

      let normal = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
      if (normal.y < 0) {
        normal = normal.negate();
        yAxis.negate();
      }

      const center = p32.clone().add(p34).add(p36).add(p38).multiplyScalar(0.25);
      // Offset the plane down slightly so it sits on the board surface rather than floating above markers
      center.add(normal.clone().multiplyScalar(-0.01)); // Move 1cm down along the normal
      plane.position.copy(center);

      const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, normal);
      plane.setRotationFromMatrix(basis);

      // Plane geometry spans 1x1 by default; scale to match board dimensions
      plane.scale.set(width, height, 1);

      // Update debug line: p32->p38 (bottom edge)
      const linePoints = new Float32Array([
        p32.x, p32.y, p32.z,  // start at p32 (bottom-right)
        p38.x, p38.y, p38.z   // end at p38 (bottom-left)
      ]);
      debugLine.geometry.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));

      // set the line colour to red
      debugLine.material.color.set(0xff0000);



      requestAnimationFrame(updatePlane);
    };

    updatePlane();
  }, []);

  return (


    <div>
      <a-scene
        ref={sceneRef}
        arjs="debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceType: webcam; sourceWidth: 1920; sourceHeight: 1080; displayWidth: 1920; displayHeight: 1080; trackingMethod: best;"

        renderer="antialias: true; precision: medium; colorManagement: true; ">

        {/* </a-marker> */}
        <a-marker type="barcode" value="32" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker32">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="1 1 1 " ></a-entity>


        </a-marker>

        <a-marker type="barcode" value="34" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker34">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="1 1 1 " ></a-entity>
        </a-marker>

        <a-marker type="barcode" value="36" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker36">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="1 1 1 " ></a-entity>
        </a-marker>

        <a-marker type="barcode" value="38" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker38">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="1 1 1 " ></a-entity>
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

  );
}
