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

    // Create plane geometry and material with texture
    const geometry = new THREE.PlaneGeometry(1, 1); // initial size, will scale
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/board.png');
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      opacity: 0.8,
      transparent: true,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.visible = false;
    planeRef.current = plane;

    // Create debug lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 10 });

    const debugLine = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
    debugLine.visible = false;
    debugLine.frustumCulled = false;
    const linePositions = new Float32Array(6);
    debugLine.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const verticalLine = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    verticalLine.visible = false;
    verticalLine.frustumCulled = false;
    const verticalPositions = new Float32Array(6);
    verticalLine.geometry.setAttribute('position', new THREE.BufferAttribute(verticalPositions, 3));

    const normalLine = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    normalLine.visible = false;
    normalLine.frustumCulled = false;
    const normalPositions = new Float32Array(6);
    normalLine.geometry.setAttribute('position', new THREE.BufferAttribute(normalPositions, 3));

    // Create 4 normal lines, one at each corner
    const normalLine1 = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    normalLine1.visible = false;
    normalLine1.frustumCulled = false;
    const normalPositions1 = new Float32Array(6);
    normalLine1.geometry.setAttribute('position', new THREE.BufferAttribute(normalPositions1, 3));

    const normalLine2 = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    normalLine2.visible = false;
    normalLine2.frustumCulled = false;
    const normalPositions2 = new Float32Array(6);
    normalLine2.geometry.setAttribute('position', new THREE.BufferAttribute(normalPositions2, 3));

    const normalLine3 = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    normalLine3.visible = false;
    normalLine3.frustumCulled = false;
    const normalPositions3 = new Float32Array(6);
    normalLine3.geometry.setAttribute('position', new THREE.BufferAttribute(normalPositions3, 3));

    const normalLine4 = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    normalLine4.visible = false;
    normalLine4.frustumCulled = false;
    const normalPositions4 = new Float32Array(6);
    normalLine4.geometry.setAttribute('position', new THREE.BufferAttribute(normalPositions4, 3));

    // Add plane and line to the A-Frame scene
    scene.object3D.add(plane);
    scene.object3D.add(debugLine);
    scene.object3D.add(verticalLine);
    scene.object3D.add(normalLine);
    scene.object3D.add(normalLine1);
    scene.object3D.add(normalLine2);
    scene.object3D.add(normalLine3);
    scene.object3D.add(normalLine4);

    // Update function called each frame
    const updatePlane = () => {
      const allVisible = markers.every((m) => m && m.object3D.visible);
      if (!allVisible) {
        plane.visible = false;
        debugLine.visible = false;
        verticalLine.visible = false;
        normalLine.visible = false;
        normalLine1.visible = false;
        normalLine2.visible = false;
        normalLine3.visible = false;
        normalLine4.visible = false;
        requestAnimationFrame(updatePlane);
        return;
      }

      plane.visible = true;
      debugLine.visible = true;
      verticalLine.visible = true;
      normalLine.visible = true;
      normalLine1.visible = true;
      normalLine2.visible = true;
      normalLine3.visible = true;
      normalLine4.visible = true;

      const [marker32, marker34, marker36, marker38] = markers;
      const p32 = new THREE.Vector3().setFromMatrixPosition(marker32.object3D.matrixWorld);
      const p34 = new THREE.Vector3().setFromMatrixPosition(marker34.object3D.matrixWorld);
      const p36 = new THREE.Vector3().setFromMatrixPosition(marker36.object3D.matrixWorld);
      const p38 = new THREE.Vector3().setFromMatrixPosition(marker38.object3D.matrixWorld);


      // Corner layout: 34 (top-left), 36 (top-right), 38 (bottom-left), 32 (bottom-right)
      // Calculate all 4 edge vectors going around the quadrilateral
      const edge1 = new THREE.Vector3().subVectors(p36, p34); // top edge: 34 -> 36
      const edge2 = new THREE.Vector3().subVectors(p32, p36); // right edge: 36 -> 32
      const edge3 = new THREE.Vector3().subVectors(p38, p32); // bottom edge: 32 -> 38
      const edge4 = new THREE.Vector3().subVectors(p34, p38); // left edge: 38 -> 34

      // Calculate the normal at each corner by taking cross product of adjacent edges
      // For an up-facing normal, we cross the "incoming" edge with the "outgoing" edge
      const normal1 = new THREE.Vector3().crossVectors(edge4, edge1).normalize(); // at p34
      const normal2 = new THREE.Vector3().crossVectors(edge1, edge2).normalize(); // at p36
      const normal3 = new THREE.Vector3().crossVectors(edge2, edge3).normalize(); // at p32
      const normal4 = new THREE.Vector3().crossVectors(edge3, edge4).normalize(); // at p38

      // Average all four normals to get a robust average normal
      const normal = new THREE.Vector3()
        .add(normal1)
        .add(normal2)
        .add(normal3)
        .add(normal4)
        .multiplyScalar(0.25)
        .normalize();

      // Use the first two edges for our main X and Y directions
      const xDir = edge1; // top edge direction from left to right
      const yDir = new THREE.Vector3().subVectors(p38, p34); // left edge direction from top to bottom

      const width = xDir.length();
      const height = yDir.length();

      if (width === 0 || height === 0) {
        requestAnimationFrame(updatePlane);
        return;
      }

      const xAxis = xDir.clone().normalize();
      let yAxis = yDir.clone().normalize();

      // Ensure orthogonality by removing any component of y along x
      const projection = xAxis.clone().multiplyScalar(yAxis.dot(xAxis));
      yAxis.sub(projection).normalize();

      if (yAxis.dot(yDir) < 0) {
        yAxis.negate();
      }

      const center = p34.clone()
        .addScaledVector(xAxis, width * 0.5)
        .addScaledVector(yAxis, height * 0.5);
      // Offset the plane slightly along the normal so it sits on the board surface
      // center.add(normal.clone().multiplyScalar(0.01));
      plane.position.copy(center);

      const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, normal);
      plane.setRotationFromMatrix(basis);

      // Plane geometry spans 1x1 by default; scale to match board dimensions
      plane.scale.set(width * 1.20, height * 1.20, 1);

      // Update debug line: p34 -> p36 (top edge)
      linePositions[0] = p34.x;
      linePositions[1] = p34.y;
      linePositions[2] = p34.z;
      linePositions[3] = p36.x;
      linePositions[4] = p36.y;
      linePositions[5] = p36.z;
      debugLine.geometry.attributes.position.needsUpdate = true; // Tell Three.js to update the geometry
      debugLine.geometry.computeBoundingSphere();

      // set the line colour to red
      debugLine.material.color.set(0xff0000);

      // Update vertical debug line: p34 -> p38 (left edge)
      verticalPositions[0] = p34.x;
      verticalPositions[1] = p34.y;
      verticalPositions[2] = p34.z;
      verticalPositions[3] = p38.x;
      verticalPositions[4] = p38.y;
      verticalPositions[5] = p38.z;
      verticalLine.geometry.attributes.position.needsUpdate = true;
      verticalLine.geometry.computeBoundingSphere();

      verticalLine.material.color.set(0x00ff00);

      // Update normal debug line: p34 -> p34 + normal (orthogonal to red and green)
      const normalLength = Math.min(width, height) * 0.5;
      const normalEnd = p34.clone().addScaledVector(normal, normalLength);
      normalPositions[0] = p34.x;
      normalPositions[1] = p34.y;
      normalPositions[2] = p34.z;
      normalPositions[3] = normalEnd.x;
      normalPositions[4] = normalEnd.y;
      normalPositions[5] = normalEnd.z;
      normalLine.geometry.attributes.position.needsUpdate = true;
      normalLine.geometry.computeBoundingSphere();

      normalLine.material.color.set(0x0000ff);

      // Draw normal vectors at each corner
      const cornerNormalLength = Math.min(width, height) * 0.3;

      // Normal at p34 (corner 1)
      const normalEnd1 = p34.clone().addScaledVector(normal1, cornerNormalLength);
      normalPositions1[0] = p34.x;
      normalPositions1[1] = p34.y;
      normalPositions1[2] = p34.z;
      normalPositions1[3] = normalEnd1.x;
      normalPositions1[4] = normalEnd1.y;
      normalPositions1[5] = normalEnd1.z;
      normalLine1.geometry.attributes.position.needsUpdate = true;
      normalLine1.geometry.computeBoundingSphere();
      normalLine1.material.color.set(0x00ffff); // cyan

      // Normal at p36 (corner 2)
      const normalEnd2 = p36.clone().addScaledVector(normal2, cornerNormalLength);
      normalPositions2[0] = p36.x;
      normalPositions2[1] = p36.y;
      normalPositions2[2] = p36.z;
      normalPositions2[3] = normalEnd2.x;
      normalPositions2[4] = normalEnd2.y;
      normalPositions2[5] = normalEnd2.z;
      normalLine2.geometry.attributes.position.needsUpdate = true;
      normalLine2.geometry.computeBoundingSphere();
      normalLine2.material.color.set(0xff00ff); // magenta

      // Normal at p32 (corner 3)
      const normalEnd3 = p32.clone().addScaledVector(normal3, cornerNormalLength);
      normalPositions3[0] = p32.x;
      normalPositions3[1] = p32.y;
      normalPositions3[2] = p32.z;
      normalPositions3[3] = normalEnd3.x;
      normalPositions3[4] = normalEnd3.y;
      normalPositions3[5] = normalEnd3.z;
      normalLine3.geometry.attributes.position.needsUpdate = true;
      normalLine3.geometry.computeBoundingSphere();
      normalLine3.material.color.set(0xffff00); // yellow

      // Normal at p38 (corner 4)
      const normalEnd4 = p38.clone().addScaledVector(normal4, cornerNormalLength);
      normalPositions4[0] = p38.x;
      normalPositions4[1] = p38.y;
      normalPositions4[2] = p38.z;
      normalPositions4[3] = normalEnd4.x;
      normalPositions4[4] = normalEnd4.y;
      normalPositions4[5] = normalEnd4.z;
      normalLine4.geometry.attributes.position.needsUpdate = true;
      normalLine4.geometry.computeBoundingSphere();
      normalLine4.material.color.set(0xff8800); // orange






      requestAnimationFrame(updatePlane);
    };

    updatePlane();
  }, []);

  return (


    <div>
      <a-scene

        ref={sceneRef}
        arjs="debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceType: webcam; sourceWidth: 1920; sourceHeight: 1080; displayWidth: 1920; displayHeight: 1080; trackingMethod: best; patternRatio: 0.4; minConfidence: 0.2; canvasWidth: 1080;
canvasHeight: 1920;
"

        renderer="antialias: true; precision: medium; colorManagement: true; ">

        {/* </a-marker> */}
        <a-marker type="barcode" value="32" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker32">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="0 0 0" ></a-entity>


        </a-marker>

        <a-marker type="barcode" value="34" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker34">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="0 0 0" ></a-entity>
        </a-marker>

        <a-marker type="barcode" value="36" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker36">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="0 0 0" ></a-entity>
        </a-marker>

        <a-marker type="barcode" value="38" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;" id="marker38">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/Box/glTF/Box.gltf)"
            scale="0 0 0" ></a-entity>
        </a-marker>

        <a-marker type="barcode" value="30" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Duck/glTF/Duck.gltf)"
            scale="2.5 2.5 2.5"
            position="0 0.5 0"></a-entity>
        </a-marker>

        <a-marker type="barcode" value="42" emitevents="true"
          arjs-anchor="changeMatrixMode: modelViewMatrix;">
          <a-entity
            gltf-model="url(https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/ToyCar/glTF/ToyCar.gltf)"
            scale="40 40 40"
            position="0 2 0"></a-entity>
        </a-marker>







        <a-entity camera>

        </a-entity>
      </a-scene>
    </div>

  );
}
