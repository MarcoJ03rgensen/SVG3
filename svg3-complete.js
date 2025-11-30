/**
 * SVG3 - 3D SVG Format with Animation & Rotation Support
 * Complete implementation with Three.js renderer
 * 
 * Features:
 * - SVG-style animations on 3D properties
 * - Interactive rotation with mouse/touch
 * - Smooth transform pipeline
 * - Three.js and Canvas renderer backends
 */

// ============================================================================
// 1. SVG3 PARSER - Parses XML into scene graph
// ============================================================================

export class SVG3Parser {
  constructor() {
    this.geometries = new Map();
    this.materials = new Map();
    this.animationTracks = [];
  }

  parse(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'text/xml');
    const root = doc.documentElement;

    if (root.tagName !== 'svg3') {
      throw new Error('Invalid SVG3: root element must be <svg3>');
    }

    const scene = {
      viewBox: root.getAttribute('viewBox'),
      metadata: this.parseMetadata(root),
      defs: this.parseDefs(root),
      scenes: this.parseScenes(root),
      animations: this.animationTracks,
    };

    return scene;
  }

  parseMetadata(root) {
    const metadata = root.querySelector('metadata');
    if (!metadata) return {};
    const result = {};
    metadata.querySelectorAll('*').forEach(el => {
      result[el.tagName] = el.textContent;
    });
    return result;
  }

  parseDefs(root) {
    const defs = root.querySelector('defs');
    if (!defs) return { geometries: [], materials: [] };

    return {
      geometries: this.parseGeometries(defs),
      materials: this.parseMaterials(defs),
    };
  }

  parseGeometries(defsElement) {
    const geometries = [];
    defsElement.querySelectorAll('geometry').forEach(geom => {
      geometries.push({
        id: geom.id,
        type: geom.getAttribute('type'),
        params: this.parseAttributes(geom),
      });
    });
    return geometries;
  }

  parseMaterials(defsElement) {
    const materials = [];
    defsElement.querySelectorAll('material').forEach(mat => {
      materials.push({
        id: mat.id,
        type: mat.getAttribute('type') || 'standard',
        params: this.parseAttributes(mat),
      });
    });
    return materials;
  }

  parseScenes(root) {
    const scenes = [];
    root.querySelectorAll('scene').forEach(sceneEl => {
      scenes.push({
        id: sceneEl.id,
        camera: sceneEl.getAttribute('camera'),
        ambientLight: parseFloat(sceneEl.getAttribute('ambientLight') || '0.5'),
        children: this.parseChildren(sceneEl),
      });
    });
    return scenes;
  }

  parseChildren(parent) {
    const children = [];
    parent.children.forEach(child => {
      if (['mesh', 'group', 'light', 'camera'].includes(child.tagName)) {
        children.push(this.parseElement(child));
      }
    });
    return children;
  }

  parseElement(el) {
    const element = {
      tag: el.tagName,
      id: el.id,
      attrs: this.parseAttributes(el),
      animations: this.parseAnimations(el),
    };

    if (['group', 'scene'].includes(el.tagName)) {
      element.children = this.parseChildren(el);
    }

    return element;
  }

  parseAnimations(el) {
    const animations = [];
    el.querySelectorAll(':scope > animate, :scope > animateTransform, :scope > set').forEach(anim => {
      animations.push({
        type: anim.tagName,
        attributeName: anim.getAttribute('attributeName'),
        from: anim.getAttribute('from'),
        to: anim.getAttribute('to'),
        dur: anim.getAttribute('dur') || '1s',
        begin: anim.getAttribute('begin') || '0s',
        end: anim.getAttribute('end'),
        repeatCount: anim.getAttribute('repeatCount') || '1',
        fill: anim.getAttribute('fill') || 'freeze',
        values: anim.getAttribute('values')?.split(';'),
        keyTimes: anim.getAttribute('keyTimes')?.split(';').map(parseFloat),
      });
      this.animationTracks.push({
        targetId: el.id,
        animation: animations[animations.length - 1],
      });
    });
    return animations;
  }

  parseAttributes(el) {
    const attrs = {};
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name;
      const value = attr.value;

      if (['position', 'rotation', 'scale'].includes(name)) {
        attrs[name] = value.split(',').map(v => parseFloat(v.trim()));
      } else if (['fov', 'aspect', 'near', 'far', 'intensity', 'metalness', 
                  'roughness', 'emissiveIntensity', 'shininess', 'opacity'].includes(name)) {
        attrs[name] = parseFloat(value);
      } else if (['castShadow', 'receiveShadow', 'bevelEnabled'].includes(name)) {
        attrs[name] = value === 'true';
      } else {
        attrs[name] = value;
      }
    });
    return attrs;
  }
}

// ============================================================================
// 2. ANIMATION ENGINE - Handles SVG-style animations on 3D properties
// ============================================================================

export class AnimationEngine {
  constructor() {
    this.activeAnimations = new Map();
    this.animationFrames = new Map();
    this.clock = { time: 0, delta: 0 };
  }

  parseTime(timeStr) {
    const match = timeStr.match(/^([\d.]+)(s|ms)?$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2] || 's';
    return unit === 'ms' ? value / 1000 : value;
  }

  registerAnimation(targetId, animationData) {
    const key = `${targetId}-${animationData.attributeName}`;
    
    this.activeAnimations.set(key, {
      targetId,
      ...animationData,
      startTime: this.parseTime(animationData.begin),
      duration: this.parseTime(animationData.dur),
      endTime: animationData.end ? this.parseTime(animationData.end) : null,
      startValue: null,
      targetValue: null,
      isActive: false,
      hasStarted: false,
      elapsed: 0,
    });
  }

  update(deltaTime, objects) {
    this.clock.time += deltaTime;
    this.clock.delta = deltaTime;

    this.activeAnimations.forEach((anim, key) => {
      const obj = objects.get(anim.targetId);
      if (!obj) return;

      // Check if animation should start
      if (!anim.hasStarted && this.clock.time >= anim.startTime) {
        anim.hasStarted = true;
        anim.isActive = true;
        anim.startValue = this.getPropertyValue(obj, anim.attributeName);
      }

      // Update animation
      if (anim.isActive) {
        anim.elapsed = this.clock.time - anim.startTime;
        const progress = Math.min(anim.elapsed / anim.duration, 1);

        if (anim.values && anim.keyTimes) {
          // Multi-value keyframe animation
          this.applyKeyframeAnimation(obj, anim, progress);
        } else {
          // Simple from/to animation
          this.applySimpleAnimation(obj, anim, progress);
        }

        // Check if animation should end
        if (progress >= 1) {
          if (anim.repeatCount === 'indefinite') {
            anim.elapsed = 0;
            anim.hasStarted = false;
          } else if (parseInt(anim.repeatCount) > 1) {
            anim.repeatCount = parseInt(anim.repeatCount) - 1;
            anim.elapsed = 0;
            anim.hasStarted = false;
          } else {
            anim.isActive = false;
            if (anim.fill !== 'freeze') {
              // Reset to initial value
            }
          }
        }
      }
    });
  }

  getPropertyValue(obj, propName) {
    const parts = propName.split('.');
    let value = obj;
    for (const part of parts) {
      value = value[part];
    }
    return value;
  }

  setPropertyValue(obj, propName, value) {
    const parts = propName.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  applySimpleAnimation(obj, anim, progress) {
    const fromValues = this.parseValues(anim.from);
    const toValues = this.parseValues(anim.to);

    const interpolated = fromValues.map((from, i) => {
      const to = toValues[i];
      return from + (to - from) * progress;
    });

    this.setPropertyValue(obj, anim.attributeName, interpolated);
  }

  applyKeyframeAnimation(obj, anim, progress) {
    // Find the two keyframes to interpolate between
    let keyIndex = 0;
    for (let i = 0; i < anim.keyTimes.length; i++) {
      if (anim.keyTimes[i] <= progress) keyIndex = i;
    }

    const nextKeyIndex = Math.min(keyIndex + 1, anim.keyTimes.length - 1);
    const keyProgress = (progress - anim.keyTimes[keyIndex]) / 
                        (anim.keyTimes[nextKeyIndex] - anim.keyTimes[keyIndex]);

    const currentValues = this.parseValues(anim.values[keyIndex]);
    const nextValues = this.parseValues(anim.values[nextKeyIndex]);

    const interpolated = currentValues.map((curr, i) => {
      const next = nextValues[i];
      return curr + (next - curr) * keyProgress;
    });

    this.setPropertyValue(obj, anim.attributeName, interpolated);
  }

  parseValues(valueStr) {
    if (typeof valueStr !== 'string') return [];
    return valueStr.split(',').map(v => parseFloat(v.trim()));
  }
}

// ============================================================================
// 3. ROTATION CONTROLLER - Interactive rotation with mouse/touch
// ============================================================================

export class RotationController {
  constructor(canvas, targetObject, sensitivity = 0.01) {
    this.canvas = canvas;
    this.targetObject = targetObject;
    this.sensitivity = sensitivity;
    
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', e => this.onMouseUp(e));

    // Touch events
    this.canvas.addEventListener('touchstart', e => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', e => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', e => this.onTouchEnd(e));
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  onMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.rotation.y += deltaX * this.sensitivity;
    this.rotation.x += deltaY * this.sensitivity;

    this.applyRotation();
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  onMouseUp(event) {
    this.isDragging = false;
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = { 
        x: event.touches[0].clientX, 
        y: event.touches[0].clientY 
      };
    }
  }

  onTouchMove(event) {
    if (!this.isDragging || event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

    this.rotation.y += deltaX * this.sensitivity;
    this.rotation.x += deltaY * this.sensitivity;

    this.applyRotation();
    this.previousMousePosition = { 
      x: event.touches[0].clientX, 
      y: event.touches[0].clientY 
    };
  }

  onTouchEnd(event) {
    this.isDragging = false;
  }

  applyRotation() {
    if (Array.isArray(this.targetObject.rotation)) {
      this.targetObject.rotation[0] = this.rotation.x;
      this.targetObject.rotation[1] = this.rotation.y;
      this.targetObject.rotation[2] = this.rotation.z;
    } else {
      this.targetObject.rotation.x = this.rotation.x;
      this.targetObject.rotation.y = this.rotation.y;
      this.targetObject.rotation.z = this.rotation.z;
    }
  }

  setSensitivity(sensitivity) {
    this.sensitivity = sensitivity;
  }

  reset() {
    this.rotation = { x: 0, y: 0, z: 0 };
    this.applyRotation();
  }
}

// ============================================================================
// 4. THREE.JS RENDERER - Renders SVG3 scenes with Three.js
// ============================================================================

export class SVG3ThreeRenderer {
  constructor(sceneData, canvas) {
    this.sceneData = sceneData;
    this.canvas = canvas;
    this.scene = null;
    this.cameras = new Map();
    this.meshes = new Map();
    this.materials = new Map();
    this.geometries = new Map();
    this.renderer = null;
    this.animationEngine = new AnimationEngine();
    this.rotationControllers = new Map();
  }

  async init() {
    const THREE = window.THREE;
    if (!THREE) throw new Error('Three.js not loaded');

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setClearColor(0x1a1a1a, 1);
    this.renderer.shadowMap.enabled = true;

    // Build scene
    this.scene = new THREE.Scene();
    this.buildGeometries(THREE);
    this.buildMaterials(THREE);
    this.buildScenes(THREE);
    this.setupAnimations();

    return { scene: this.scene, renderer: this.renderer };
  }

  buildGeometries(THREE) {
    this.sceneData.defs.geometries.forEach(geom => {
      let geometry;
      const p = geom.params;

      switch (geom.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(p.width || 1, p.height || 1, p.depth || 1);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            p.radius || 1, 
            p.widthSegments || 32, 
            p.heightSegments || 32
          );
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            p.radiusTop || 1, p.radiusBottom || 1, p.height || 2,
            p.radialSegments || 32, p.heightSegments || 1
          );
          break;
        case 'plane':
          geometry = new THREE.PlaneGeometry(p.width || 1, p.height || 1);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(
            p.radius || 1, p.tube || 0.4, p.radialSegments || 16, p.tubularSegments || 100
          );
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      this.geometries.set(geom.id, geometry);
    });
  }

  buildMaterials(THREE) {
    this.sceneData.defs.materials.forEach(mat => {
      let material;
      const p = mat.params;

      switch (mat.type) {
        case 'standard':
          material = new THREE.MeshStandardMaterial({
            color: p.color || 0xffffff,
            metalness: p.metalness || 0,
            roughness: p.roughness || 0.5,
            emissive: p.emissive || 0x000000,
            emissiveIntensity: p.emissiveIntensity || 0,
          });
          break;
        case 'lambert':
          material = new THREE.MeshLambertMaterial({
            color: p.color || 0xffffff,
            emissive: p.emissive || 0x000000,
          });
          break;
        case 'phong':
          material = new THREE.MeshPhongMaterial({
            color: p.color || 0xffffff,
            emissive: p.emissive || 0x000000,
            shininess: p.shininess || 100,
          });
          break;
        default:
          material = new THREE.MeshBasicMaterial({ color: p.color || 0xffffff });
      }

      this.materials.set(mat.id, material);
    });
  }

  buildScenes(THREE) {
    this.sceneData.scenes.forEach(sceneData => {
      this.buildScene(THREE, sceneData);
    });
  }

  buildScene(THREE, sceneData) {
    // Set up camera
    const cameraData = sceneData.children?.find(c => c.id === sceneData.camera);
    if (cameraData) {
      const camera = this.buildCamera(THREE, cameraData);
      this.cameras.set(cameraData.id, camera);
      this.scene.add(camera);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, sceneData.ambientLight || 0.5);
    this.scene.add(ambientLight);

    // Build objects
    sceneData.children?.forEach(child => {
      const object = this.buildElement(THREE, child);
      if (object) {
        this.scene.add(object);
      }
    });
  }

  buildElement(THREE, elementData) {
    if (elementData.tag === 'mesh') {
      return this.buildMesh(THREE, elementData);
    } else if (elementData.tag === 'group') {
      return this.buildGroup(THREE, elementData);
    } else if (elementData.tag === 'light') {
      return this.buildLight(THREE, elementData);
    }
    return null;
  }

  buildMesh(THREE, meshData) {
    const geom = this.geometries.get(meshData.attrs.geometry);
    const mat = this.materials.get(meshData.attrs.material);

    if (!geom || !mat) {
      console.warn(`Missing geometry or material for mesh ${meshData.id}`);
      return null;
    }

    const mesh = new THREE.Mesh(geom, mat.clone());
    mesh.name = meshData.id;

    const pos = meshData.attrs.position || [0, 0, 0];
    const rot = meshData.attrs.rotation || [0, 0, 0];
    const scale = meshData.attrs.scale || [1, 1, 1];

    mesh.position.set(...pos);
    mesh.rotation.order = 'XYZ';
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);

    mesh.castShadow = meshData.attrs.castShadow || false;
    mesh.receiveShadow = meshData.attrs.receiveShadow || false;

    this.meshes.set(meshData.id, mesh);
    return mesh;
  }

  buildGroup(THREE, groupData) {
    const group = new THREE.Group();
    group.name = groupData.id;

    const pos = groupData.attrs?.position || [0, 0, 0];
    const rot = groupData.attrs?.rotation || [0, 0, 0];
    const scale = groupData.attrs?.scale || [1, 1, 1];

    group.position.set(...pos);
    group.rotation.order = 'XYZ';
    group.rotation.set(...rot);
    group.scale.set(...scale);

    this.meshes.set(groupData.id, group);

    groupData.children?.forEach(child => {
      const obj = this.buildElement(THREE, child);
      if (obj) group.add(obj);
    });

    return group;
  }

  buildCamera(THREE, cameraData) {
    const attrs = cameraData.attrs;
    const camera = new THREE.PerspectiveCamera(
      attrs.fov || 75,
      this.canvas.clientWidth / this.canvas.clientHeight,
      attrs.near || 0.1,
      attrs.far || 1000
    );

    const pos = attrs.position || [0, 0, 5];
    camera.position.set(...pos);

    return camera;
  }

  buildLight(THREE, lightData) {
    const attrs = lightData.attrs;
    const color = attrs.color || 0xffffff;
    const intensity = attrs.intensity || 1;

    let light;
    switch (attrs.type) {
      case 'directional':
        light = new THREE.DirectionalLight(color, intensity);
        light.castShadow = true;
        break;
      case 'point':
        light = new THREE.PointLight(color, intensity);
        break;
      case 'spot':
        light = new THREE.SpotLight(color, intensity);
        break;
      default:
        light = new THREE.AmbientLight(color, intensity);
    }

    const pos = attrs.position || [0, 0, 5];
    light.position.set(...pos);

    return light;
  }

  setupAnimations() {
    this.sceneData.animations.forEach(track => {
      this.animationEngine.registerAnimation(track.targetId, track.animation);
    });
  }

  setupRotationControl(objectId, sensitivity = 0.01) {
    const obj = this.meshes.get(objectId);
    if (!obj) {
      console.warn(`Object ${objectId} not found for rotation control`);
      return null;
    }

    const controller = new RotationController(this.canvas, obj, sensitivity);
    this.rotationControllers.set(objectId, controller);
    return controller;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update animations
    this.animationEngine.update(0.016, this.meshes);

    // Render
    const camera = Array.from(this.cameras.values())[0];
    if (camera) {
      this.renderer.render(this.scene, camera);
    }
  }

  onWindowResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.cameras.forEach(camera => {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    this.renderer.setSize(width, height);
  }

  dispose() {
    this.geometries.forEach(geom => geom.dispose());
    this.materials.forEach(mat => mat.dispose());
    this.renderer.dispose();
  }
}

export default {
  SVG3Parser,
  AnimationEngine,
  RotationController,
  SVG3ThreeRenderer,
};
