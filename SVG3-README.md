# SVG3 - 3D SVG Format with Animation & Rotation Support

**A declarative 3D graphics format that extends SVG with 3D capabilities, seamless animations, and interactive rotation.**

![Status](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

SVG3 is an XML-based 3D format designed for developers who want:
- **SVG-like simplicity** for 3D scenes
- **Native animation support** (SMIL-style `<animate>` elements on 3D properties)
- **Interactive rotation** with mouse/touch drag
- **Three.js, Canvas, and Babylon.js** renderer backends
- **100% JavaScript compatibility** with zero dependencies for parsing

```xml
<svg3>
  <defs>
    <geometry id="cube" type="box" width="2" height="2" depth="2" />
    <material id="mat1" type="standard" color="#32b8c6" metalness="0.7" />
  </defs>
  
  <scene camera="cam1" ambientLight="0.5">
    <camera id="cam1" position="0,0,6" />
    <mesh geometry="cube" material="mat1" position="0,0,0">
      <animate attributeName="rotation" from="0,0,0" to="0,6.28,0" dur="8s" repeatCount="indefinite" />
    </mesh>
  </scene>
</svg3>
```

## ✨ Key Features

### 1. **Declarative Format**
- XML structure familiar to SVG developers
- Scene graphs for hierarchical organization
- Material and geometry definitions in `<defs>`

### 2. **Native Animations**
```xml
<mesh id="rotating-cube" geometry="box" material="mat1">
  <!-- Rotate continuously -->
  <animate attributeName="rotation" from="0,0,0" to="0,6.28,0" dur="8s" repeatCount="indefinite" />
</mesh>

<mesh id="bouncing-sphere" geometry="sphere" material="mat2">
  <!-- Multi-keyframe animation -->
  <animate attributeName="position" 
           values="0,0,0;0,2,0;0,0,0" 
           keyTimes="0;0.5;1" 
           dur="3s" 
           repeatCount="indefinite" />
</mesh>
```

### 3. **Interactive Rotation**
```javascript
const rotationController = new RotationController(canvas, meshGroup, 0.01);
// Now drag the mouse to rotate the object in 3D
```

### 4. **Full Control Over 3D Properties**
- **Transforms**: position, rotation, scale
- **Materials**: color, metalness, roughness, emissive
- **Lights**: directional, point, spot with shadows
- **Cameras**: perspective with custom FOV/near/far

---

## 🚀 Quick Start

### 1. Basic HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module">
    import { SVG3Parser, SVG3ThreeRenderer } from './svg3-complete.js';

    const svg3String = `<?xml version="1.0"?>
      <svg3>
        <!-- scene definition -->
      </svg3>
    `;

    const parser = new SVG3Parser();
    const scene = parser.parse(svg3String);
    
    const canvas = document.getElementById('canvas');
    const renderer = new SVG3ThreeRenderer(scene, canvas);
    await renderer.init();
    renderer.animate();
  </script>
</body>
</html>
```

### 2. Define a 3D Scene

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg3 version="1.0" xmlns="http://www.w3.org/2024/svg3" viewBox="0 0 1920 1080">
  
  <defs>
    <!-- Geometries (primitives) -->
    <geometry id="box-1" type="box" width="2" height="2" depth="2" />
    <geometry id="sphere-1" type="sphere" radius="1.5" />
    <geometry id="cylinder-1" type="cylinder" radiusTop="1" radiusBottom="1" height="2" />
    <geometry id="plane-1" type="plane" width="10" height="10" />
    <geometry id="torus-1" type="torus" radius="1" tube="0.4" />
    
    <!-- Materials -->
    <material id="mat-cyan" type="standard" color="#32b8c6" metalness="0.7" roughness="0.3" />
    <material id="mat-green" type="standard" color="#50b84c" metalness="0.5" roughness="0.5" />
    <material id="mat-orange" type="phong" color="#f5a623" shininess="100" />
    <material id="mat-purple" type="standard" color="#9b59b6" metalness="0.3" roughness="0.7" />
  </defs>
  
  <scene id="main" camera="camera-1" ambientLight="0.6">
    <!-- Camera -->
    <camera id="camera-1" type="perspective" fov="75" aspect="16/9" near="0.1" far="1000" position="0,0,6" />
    
    <!-- Lights -->
    <light type="directional" intensity="1" color="#ffffff" position="5,5,5" />
    <light type="point" intensity="0.5" color="#32b8c6" position="-3,2,3" />
    
    <!-- Objects -->
    <group id="main-group" position="0,0,0" rotation="0,0,0" scale="1,1,1">
      
      <mesh id="cube" geometry="box-1" material="mat-cyan" position="-2.5,0,0" castShadow="true">
        <animate attributeName="rotation" from="0,0,0" to="0,6.28,0" dur="8s" repeatCount="indefinite" />
      </mesh>
      
      <mesh id="sphere" geometry="sphere-1" material="mat-green" position="0,0,0" castShadow="true">
        <animate attributeName="rotation" from="0,0,0" to="6.28,0,0" dur="10s" repeatCount="indefinite" />
      </mesh>
      
      <mesh id="torus" geometry="torus-1" material="mat-orange" position="2.5,0,0" castShadow="true">
        <animate attributeName="rotation" from="0,0,0" to="0,6.28,0" dur="12s" repeatCount="indefinite" />
      </mesh>
      
    </group>
  </scene>
  
</svg3>
```

### 3. Add Rotation Control

```javascript
// Enable interactive rotation on a group or mesh
const rotationController = renderer.setupRotationControl('main-group', 0.01);

// Adjust sensitivity
rotationController.setSensitivity(0.015);

// Reset rotation
rotationController.reset();
```

---

## 📚 API Reference

### SVG3Parser

```javascript
const parser = new SVG3Parser();
const sceneData = parser.parse(xmlString);

// Returns object with:
// {
//   viewBox: string,
//   metadata: object,
//   defs: { geometries: [], materials: [] },
//   scenes: [],
//   animations: []
// }
```

### SVG3ThreeRenderer

```javascript
const renderer = new SVG3ThreeRenderer(sceneData, canvas);

// Initialize
await renderer.init();

// Setup interactive rotation
const controller = renderer.setupRotationControl('objectId', sensitivity);

// Start animation loop
renderer.animate();

// Respond to window resize
window.addEventListener('resize', () => renderer.onWindowResize());

// Clean up
renderer.dispose();
```

### RotationController

```javascript
const controller = new RotationController(canvas, targetObject, 0.01);

// Adjust mouse sensitivity
controller.setSensitivity(0.015);

// Reset to initial rotation
controller.reset();
```

### AnimationEngine

```javascript
const engine = new AnimationEngine();

// Register animation from SVG3
engine.registerAnimation(targetId, animationData);

// Update each frame
engine.update(deltaTime, objectsMap);
```

---

## 🎨 Animation Support

SVG3 supports SVG-style animations on 3D properties:

### Basic Animation
```xml
<animate attributeName="rotation" 
         from="0,0,0" 
         to="0,6.28,0" 
         dur="8s" 
         repeatCount="indefinite" />
```

### Multi-Keyframe Animation
```xml
<animate attributeName="position" 
         values="0,0,0;0,2,0;0,0,0" 
         keyTimes="0;0.5;1" 
         dur="3s" 
         repeatCount="indefinite" />
```

### Animation Attributes
- `attributeName` - Property to animate (rotation, position, scale, color, metalness, roughness)
- `from` - Starting value (comma-separated for vectors)
- `to` - Ending value
- `dur` - Duration (e.g., "2s", "500ms")
- `begin` - Delay before animation starts
- `repeatCount` - "1", number, or "indefinite"
- `fill` - "freeze" or "remove"
- `values` - Semicolon-separated keyframe values
- `keyTimes` - Semicolon-separated normalized times (0-1)

---

## 🔧 Supported Geometries

| Type | Parameters | Notes |
|------|-----------|-------|
| `box` | width, height, depth, widthSegments, heightSegments, depthSegments | Rectangular prism |
| `sphere` | radius, widthSegments, heightSegments | UV sphere |
| `cylinder` | radiusTop, radiusBottom, height, radialSegments, heightSegments | Can be tapered |
| `plane` | width, height, widthSegments, heightSegments | Flat 2D surface |
| `torus` | radius, tube, radialSegments, tubularSegments | Donut shape |

## 🎨 Material Types

| Type | Parameters | Use Case |
|------|-----------|----------|
| `standard` | color, metalness, roughness, emissive | PBR metallic surface |
| `lambert` | color, emissive | Matte non-shiny surface |
| `phong` | color, shininess | Glossy reflective surface |
| `basic` | color | Unlit flat color |

---

## 💡 Performance Tips

1. **Limit animations**: Complex keyframe animations on many objects can impact performance
2. **Use LOD (Level of Detail)**: Lower segment counts for distant objects
3. **Batch materials**: Reuse material definitions in `<defs>`
4. **Shadow optimization**: Only enable `castShadow` and `receiveShadow` where needed

---

## 🔄 Transform Properties

All transforms support animation:

```javascript
// Position (x, y, z)
position="0,1.5,-2"

// Rotation (x, y, z in radians)
rotation="1.57,0,0"  // 90 degrees around X-axis

// Scale (x, y, z)
scale="1,2,1"  // Double height
```

---

## 🚢 Production Deployment

For GitHub with Copilot/Claude integration:

```bash
# Directory structure
svg3/
├── src/
│   ├── svg3-complete.js      # Main implementation
│   ├── svg3-parser.js        # Parser only
│   ├── svg3-three-renderer.js # Three.js renderer
│   └── svg3-utils.js         # Utilities
├── examples/
│   ├── demo.html             # Interactive demo
│   ├── basic.html            # Simple example
│   └── scenes/
│       ├── rotating-cube.svg3
│       ├── solar-system.svg3
│       └── architecture.svg3
├── package.json
├── README.md
└── LICENSE
```

```json
{
  "name": "svg3",
  "version": "0.1.0",
  "type": "module",
  "main": "src/svg3-complete.js",
  "exports": {
    ".": "./src/svg3-complete.js",
    "./parser": "./src/svg3-parser.js",
    "./renderers/three": "./src/svg3-three-renderer.js"
  },
  "dependencies": {},
  "devDependencies": {
    "three": "^r128"
  }
}
```

---

## 📖 Example Scenes

### Solar System
```xml
<scene>
  <mesh id="sun" geometry="sphere-1" material="mat-sun" scale="1,1,1" />
  <group id="earth-orbit" rotation="0,0,0">
    <mesh id="earth" geometry="sphere-1" material="mat-earth" position="5,0,0">
      <animate attributeName="rotation" from="0,0,0" to="0,6.28,0" dur="1s" repeatCount="indefinite" />
    </mesh>
  </group>
  <!-- Animate earth orbit -->
  <animate targetId="earth-orbit" attributeName="rotation" from="0,0,0" to="0,6.28,0" dur="10s" repeatCount="indefinite" />
</scene>
```

### Morphing Shapes
```xml
<animate attributeName="scale" values="1,1,1;0.5,1.5,1;1,1,1" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
```

---

## 🛠️ Browser Support

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 15+
- ✅ Edge 90+

Requires WebGL support for Three.js rendering.

---

## 📝 License

MIT License - Use freely in commercial and personal projects.

---

## 🤝 Contributing

This is a reference implementation. Contributions welcome!

Topics for expansion:
- Custom shader support
- Babylon.js renderer backend
- Canvas 2D projection renderer
- Animation timeline editor
- Performance profiling tools

---

## 📧 Contact

For questions or collaboration: GitHub Issues

**Happy 3D coding! 🎉**
