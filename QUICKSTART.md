# SVG3 Quick Setup & Usage Guide

## 📦 Files Overview

Your SVG3 implementation includes:

### Core Files
- **svg3-complete.js** - Full implementation with parser, animation engine, rotation controller, Three.js renderer
- **svg3-demo.html** - Interactive demo with 4 animated 3D objects and live controls
- **svg3-advanced-scene.xml** - Production example with complex animations and lighting
- **SVG3-README.md** - Complete API documentation

---

## 🎬 Getting Started (5 minutes)

### Step 1: Open the Demo

Simply open `svg3-demo.html` in your browser. You should see:
- 4 rotating 3D objects (cube, sphere, torus, cylinder)
- Interactive rotation (drag to rotate)
- Live material controls on the right panel
- Real-time FPS and animation stats

**Features in demo:**
- ✅ Drag to rotate all objects
- ✅ Ambient light slider
- ✅ Material metalness/roughness adjustment
- ✅ Auto-rotate toggle
- ✅ Sensitivity control for rotation
- ✅ Color hue adjustment

---

## 🏗️ Implementation Architecture

```
SVG3 File (XML)
    ↓
SVG3Parser
    ↓ (parses XML into scene graph)
    ↓
Scene Data Object
    ├── geometries
    ├── materials
    ├── scenes
    └── animations
    ↓
SVG3ThreeRenderer
    ├── BuildGeometries (BoxGeometry, SphereGeometry, etc.)
    ├── BuildMaterials (MeshStandardMaterial, MeshPhongMaterial, etc.)
    ├── BuildScene (cameras, lights, meshes, groups)
    ├── AnimationEngine (updates 3D properties each frame)
    └── RotationController (handles mouse/touch drag)
    ↓
Three.js Scene
    ↓
WebGL Renderer
```

---

## ⚡ Key Components

### 1. **SVG3Parser**
Converts XML string to JavaScript scene object

```javascript
import { SVG3Parser } from './svg3-complete.js';

const parser = new SVG3Parser();
const sceneData = parser.parse(xmlString);
```

### 2. **SVG3ThreeRenderer**
Converts scene data to Three.js objects and renders

```javascript
import { SVG3ThreeRenderer } from './svg3-complete.js';

const renderer = new SVG3ThreeRenderer(sceneData, canvas);
await renderer.init();  // Build geometry/materials/scene
renderer.animate();     // Start animation loop

// Enable rotation
renderer.setupRotationControl('object-id', 0.01);
```

### 3. **AnimationEngine**
Manages SVG-style animations on 3D properties

```javascript
const engine = new AnimationEngine();
engine.registerAnimation(targetId, animationData);
engine.update(deltaTime, objectsMap);
```

### 4. **RotationController**
Handles interactive mouse/touch rotation

```javascript
import { RotationController } from './svg3-complete.js';

const controller = new RotationController(canvas, target, 0.01);
controller.setSensitivity(0.015);
controller.reset();
```

---

## 🎨 Animation Syntax

### Continuous Rotation
```xml
<mesh id="rotating-box" geometry="box" material="mat1">
  <animate attributeName="rotation" 
           from="0,0,0" 
           to="0,6.28,0" 
           dur="8s" 
           repeatCount="indefinite" />
</mesh>
```

### Keyframe Animation (Bouncing)
```xml
<mesh id="bouncing-sphere" geometry="sphere" material="mat2">
  <animate attributeName="position" 
           values="0,0,0;0,2,0;0,0,0" 
           keyTimes="0;0.5;1" 
           dur="3s" 
           repeatCount="indefinite" />
</mesh>
```

### Scale Pulsing
```xml
<mesh id="pulsing-box" geometry="box" material="mat3">
  <animate attributeName="scale" 
           values="1,1,1;1.2,1.2,1.2;1,1,1" 
           keyTimes="0;0.5;1" 
           dur="2s" 
           repeatCount="indefinite" />
</mesh>
```

### Color Change
```xml
<mesh id="color-changing" geometry="sphere" material="mat4">
  <animate attributeName="color" 
           values="#ff0000;#00ff00;#0000ff;#ff0000" 
           keyTimes="0;0.33;0.66;1" 
           dur="6s" 
           repeatCount="indefinite" />
</mesh>
```

---

## 🔧 Creating Your Own Scene

### Step 1: Define Geometries
```xml
<defs>
  <geometry id="my-box" type="box" width="2" height="2" depth="2" />
  <geometry id="my-sphere" type="sphere" radius="1.5" />
</defs>
```

### Step 2: Define Materials
```xml
<defs>
  <material id="my-material" 
            type="standard" 
            color="#32b8c6" 
            metalness="0.7" 
            roughness="0.3" />
</defs>
```

### Step 3: Create Scene
```xml
<scene id="main" camera="cam1" ambientLight="0.5">
  <camera id="cam1" position="0,0,6" />
  <light type="directional" intensity="1" position="5,5,5" />
  
  <mesh id="my-object" 
        geometry="my-box" 
        material="my-material" 
        position="0,0,0">
    <animate attributeName="rotation" 
             from="0,0,0" 
             to="0,6.28,0" 
             dur="8s" 
             repeatCount="indefinite" />
  </mesh>
</scene>
```

### Step 4: Render in HTML
```html
<canvas id="canvas"></canvas>

<script type="module">
  import { SVG3Parser, SVG3ThreeRenderer } from './svg3-complete.js';

  const svgString = `<!-- your SVG3 XML here -->`;
  
  const parser = new SVG3Parser();
  const scene = parser.parse(svgString);
  
  const canvas = document.getElementById('canvas');
  const renderer = new SVG3ThreeRenderer(scene, canvas);
  await renderer.init();
  renderer.setupRotationControl('my-object', 0.01);
  renderer.animate();
</script>
```

---

## 📐 Geometry Types & Parameters

```xml
<!-- Box -->
<geometry id="box" type="box" 
          width="2" height="2" depth="2" 
          widthSegments="1" heightSegments="1" depthSegments="1" />

<!-- Sphere -->
<geometry id="sphere" type="sphere" 
          radius="1.5" 
          widthSegments="32" heightSegments="32" />

<!-- Cylinder -->
<geometry id="cylinder" type="cylinder" 
          radiusTop="1" radiusBottom="1" height="2" 
          radialSegments="32" heightSegments="1" />

<!-- Plane -->
<geometry id="plane" type="plane" 
          width="10" height="10" 
          widthSegments="1" heightSegments="1" />

<!-- Torus (donut) -->
<geometry id="torus" type="torus" 
          radius="1.5" tube="0.4" 
          radialSegments="16" tubularSegments="100" />
```

---

## 🎨 Material Types & Parameters

```xml
<!-- Standard (PBR) - Recommended for most uses -->
<material id="std" type="standard" 
          color="#32b8c6" 
          metalness="0.7" 
          roughness="0.3" 
          emissive="#000000" 
          emissiveIntensity="0" />

<!-- Lambert - Matte non-shiny -->
<material id="matte" type="lambert" 
          color="#50b84c" 
          emissive="#000000" />

<!-- Phong - Glossy with highlights -->
<material id="glossy" type="phong" 
          color="#f5a623" 
          shininess="100" />

<!-- Basic - Unlit flat color -->
<material id="flat" type="basic" 
          color="#ffffff" />
```

---

## 🎯 Common Patterns

### Pattern 1: Rotating Group of Objects
```xml
<group id="orbit" position="0,0,0">
  <mesh id="obj1" geometry="sphere" material="mat1" position="3,0,0" />
  <mesh id="obj2" geometry="box" material="mat2" position="-3,0,0" />
  
  <!-- Rotate entire group -->
  <animate attributeName="rotation" 
           from="0,0,0" 
           to="0,6.28,0" 
           dur="10s" 
           repeatCount="indefinite" />
</group>
```

### Pattern 2: Nested Animations
```xml
<group id="container" position="0,0,0">
  <mesh id="inner" geometry="box" material="mat1">
    <!-- Inner object rotates fast -->
    <animate attributeName="rotation" 
             from="0,0,0" 
             to="0,6.28,0" 
             dur="4s" 
             repeatCount="indefinite" />
  </mesh>
  
  <!-- Container rotates slow -->
  <animate attributeName="rotation" 
           from="0,0,0" 
           to="0,6.28,0" 
           dur="12s" 
           repeatCount="indefinite" />
</group>
```

### Pattern 3: Wave Motion
```xml
<mesh id="wave" geometry="sphere" material="mat1" position="0,0,0">
  <animate attributeName="position" 
           values="0,0,0; 0,1,0; 0,-1,0; 0,0,0" 
           keyTimes="0;0.25;0.75;1" 
           dur="4s" 
           repeatCount="indefinite" />
</mesh>
```

### Pattern 4: Pulsing Effect
```xml
<mesh id="pulse" geometry="box" material="mat1" scale="1,1,1">
  <animate attributeName="scale" 
           values="1,1,1; 1.3,1.3,1.3; 1,1,1" 
           keyTimes="0;0.5;1" 
           dur="2s" 
           repeatCount="indefinite" />
</mesh>
```

---

## 🔌 API Quick Reference

### Renderer Methods
```javascript
const renderer = new SVG3ThreeRenderer(sceneData, canvas);

await renderer.init();                    // Initialize
renderer.animate();                       // Start loop
renderer.setupRotationControl(id, sens);  // Enable rotation
renderer.onWindowResize();                // Handle resize
renderer.dispose();                       // Cleanup
```

### Rotation Controller Methods
```javascript
const controller = new RotationController(canvas, object, 0.01);

controller.setSensitivity(0.015);  // Adjust mouse sensitivity
controller.reset();                 // Reset to initial rotation
controller.applyRotation();         // Apply current rotation state
```

### Animation Engine Methods
```javascript
const engine = new AnimationEngine();

engine.registerAnimation(id, animData);  // Register animation
engine.update(deltaTime, objects);       // Update animations
```

---

## ⚙️ Transform Properties

All transforms use comma-separated values:

```xml
<!-- Position (x, y, z) -->
position="0,1.5,-2"

<!-- Rotation (x, y, z in radians) -->
rotation="0,1.57,0"    <!-- 90° around Y-axis -->

<!-- Scale (x, y, z) -->
scale="1,2,1"          <!-- Double height -->
```

### Common Rotation Values
- `0` = 0°
- `1.57` = 90°
- `3.14` = 180°
- `6.28` = 360° (full rotation)

---

## 📱 Responsive Design

```javascript
// Handle window resize
window.addEventListener('resize', () => {
  renderer.onWindowResize();
});
```

---

## 🚀 Deployment Checklist

- [ ] Test in Chrome, Firefox, Safari
- [ ] Verify mouse/touch rotation works
- [ ] Check animations are smooth (60 FPS)
- [ ] Optimize geometry segment counts
- [ ] Compress .svg3 files
- [ ] Use production Three.js build

---

## 🐛 Debugging Tips

### Check FPS
```javascript
document.getElementById('fps').textContent  // See current FPS
```

### Verify Animation
```javascript
console.log(sceneData.animations);  // Check animations parsed
```

### Test Rotation
```javascript
renderer.setupRotationControl('object-id', 0.01);
// Try dragging in canvas
```

---

## 🎓 Learning Path

1. **Start**: Open demo.html, interact with controls
2. **Modify**: Change values in svg3-demo.html inline XML
3. **Create**: Use svg3-advanced-scene.xml as template
4. **Deploy**: Embed in your own projects

---

## 🔗 File Connections

```
svg3-complete.js ← Main implementation (parser + renderers)
    ↓
svg3-demo.html ← Interactive demo (includes inline XML)
    ↓
svg3-advanced-scene.xml ← Production example scene
```

Load any scene into the demo:
```javascript
const response = await fetch('svg3-advanced-scene.xml');
const svgString = await response.text();
const sceneData = parser.parse(svgString);
```

---

## 📞 Common Issues & Solutions

### Q: Objects not showing
A: Check camera position and FOV. Default is looking at (0,0,0) from (0,0,6).

### Q: Animations not playing
A: Verify `repeatCount="indefinite"` or set explicit count. Check `begin` time.

### Q: Rotation feels jerky
A: Increase sensitivity value (0.01 → 0.03) or check FPS (should be 60+).

### Q: Materials look flat
A: Use `type="standard"` with metalness/roughness. Add lights with proper position.

### Q: Performance slow
A: Reduce geometry segments (sphere widthSegments: 32 → 16), limit shadows, disable unused animations.

---

## 📚 Next Steps

1. **Explore**: Read SVG3-README.md for complete API
2. **Experiment**: Create custom scenes in svg3-advanced-scene.xml format
3. **Deploy**: Embed into your projects (React, Vue, vanilla JS)
4. **Extend**: Add custom shaders, physics, post-processing

---

**Happy 3D creation! 🚀**
