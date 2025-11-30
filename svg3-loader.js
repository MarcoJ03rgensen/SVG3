/**
 * SVG3 Loader - Direct URL loading for .svg3 files
 * Makes SVG3 files feel more "native" by allowing direct URL loading
 */

class SVG3Loader {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Loading indicator
    this.loadingDiv = document.createElement('div');
    this.loadingDiv.innerHTML = 'Loading SVG3...';
    this.loadingDiv.style.position = 'absolute';
    this.loadingDiv.style.top = '50%';
    this.loadingDiv.style.left = '50%';
    this.loadingDiv.style.transform = 'translate(-50%, -50%)';
    this.loadingDiv.style.color = '#32b8c6';
    this.loadingDiv.style.fontFamily = 'Arial, sans-serif';
    this.loadingDiv.style.fontSize = '18px';
    this.container.appendChild(this.loadingDiv);

    // Error display
    this.errorDiv = document.createElement('div');
    this.errorDiv.style.position = 'absolute';
    this.errorDiv.style.top = '50%';
    this.errorDiv.style.left = '50%';
    this.errorDiv.style.transform = 'translate(-50%, -50%)';
    this.errorDiv.style.color = '#ff6b6b';
    this.errorDiv.style.fontFamily = 'Arial, sans-serif';
    this.errorDiv.style.textAlign = 'center';
    this.errorDiv.style.display = 'none';
    this.container.appendChild(this.errorDiv);

    // Make container relative positioned
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '400px'; // Default height
  }

  async load(url) {
    try {
      this.showLoading();

      // Fetch SVG3 file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load SVG3 file: ${response.status} ${response.statusText}`);
      }

      const svg3Text = await response.text();

      // Parse and render
      await this.parseAndRender(svg3Text);

      this.hideLoading();

    } catch (error) {
      console.error('SVG3Loader error:', error);
      this.showError(error.message);
    }
  }

  async parseAndRender(svg3Text) {
    // Embed SVG3 implementation (same as demo)
    const SVG3_IMPLEMENTATION = `
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
    if (!defs) return { geometries: {}, materials: {} };

    return {
      geometries: this.parseGeometries(defs),
      materials: this.parseMaterials(defs),
    };
  }

  parseGeometries(defs) {
    const geometries = {};
    defs.querySelectorAll('geometry').forEach(geo => {
      const id = geo.getAttribute('id');
      const type = geo.getAttribute('type');
      const params = {};

      Array.from(geo.attributes).forEach(attr => {
        if (attr.name !== 'id' && attr.name !== 'type') {
          const value = attr.value;
          params[attr.name] = isNaN(value) ? value : parseFloat(value);
        }
      });

      geometries[id] = { type, params };
    });
    return geometries;
  }

  parseMaterials(defs) {
    const materials = {};
    defs.querySelectorAll('material').forEach(mat => {
      const id = mat.getAttribute('id');
      const type = mat.getAttribute('type') || 'standard';
      const params = {};

      Array.from(mat.attributes).forEach(attr => {
        if (attr.name !== 'id' && attr.name !== 'type') {
          const value = attr.value;
          if (value.startsWith('#')) {
            params[attr.name] = value;
          } else if (!isNaN(value)) {
            params[attr.name] = parseFloat(value);
          } else if (value === 'true' || value === 'false') {
            params[attr.name] = value === 'true';
          } else {
            params[attr.name] = value;
          }
        }
      });

      materials[id] = { type, params };
    });
    return materials;
  }

  parseScenes(root) {
    const scenes = {};
    root.querySelectorAll('scene').forEach(sceneEl => {
      const id = sceneEl.getAttribute('id');
      const scene = {
        id,
        camera: sceneEl.getAttribute('camera'),
        ambientLight: parseFloat(sceneEl.getAttribute('ambientLight')) || 0.5,
        lights: [],
        objects: [],
      };

      const cameraEl = sceneEl.querySelector('camera');
      if (cameraEl) {
        scene.camera = {
          id: cameraEl.getAttribute('id'),
          type: cameraEl.getAttribute('type') || 'perspective',
          fov: parseFloat(cameraEl.getAttribute('fov')) || 75,
          aspect: cameraEl.getAttribute('aspect') || '16/9',
          near: parseFloat(cameraEl.getAttribute('near')) || 0.1,
          far: parseFloat(cameraEl.getAttribute('far')) || 1000,
          position: this.parseVector3(cameraEl.getAttribute('position')) || [0, 0, 5],
        };
      }

      sceneEl.querySelectorAll('light').forEach(lightEl => {
        const light = {
          type: lightEl.getAttribute('type') || 'directional',
          intensity: parseFloat(lightEl.getAttribute('intensity')) || 1,
          color: lightEl.getAttribute('color') || '#ffffff',
          position: this.parseVector3(lightEl.getAttribute('position')) || [5, 5, 5],
        };
        scene.lights.push(light);
      });

      this.parseObjects(sceneEl, scene.objects, null);
      scenes[id] = scene;
    });
    return scenes;
  }

  parseObjects(parentEl, objects, parentId) {
    parentEl.querySelectorAll(':scope > mesh, :scope > group').forEach(objEl => {
      const obj = {
        id: objEl.getAttribute('id'),
        type: objEl.tagName,
        parent: parentId,
        position: this.parseVector3(objEl.getAttribute('position')) || [0, 0, 0],
        rotation: this.parseVector3(objEl.getAttribute('rotation')) || [0, 0, 0],
        scale: this.parseVector3(objEl.getAttribute('scale')) || [1, 1, 1],
        animations: [],
      };

      if (objEl.tagName === 'mesh') {
        obj.geometry = objEl.getAttribute('geometry');
        obj.material = objEl.getAttribute('material');
        obj.castShadow = objEl.getAttribute('castShadow') === 'true';
        obj.receiveShadow = objEl.getAttribute('receiveShadow') === 'true';
      }

      objEl.querySelectorAll('animate').forEach(animEl => {
        const anim = {
          attributeName: animEl.getAttribute('attributeName'),
          from: this.parseVector3(animEl.getAttribute('from')),
          to: this.parseVector3(animEl.getAttribute('to')),
          dur: animEl.getAttribute('dur') || '1s',
          repeatCount: animEl.getAttribute('repeatCount') || '1',
          targetId: obj.id,
        };
        obj.animations.push(anim);
        this.animationTracks.push(anim);
      });

      objects.push(obj);

      if (objEl.tagName === 'group') {
        this.parseObjects(objEl, objects, obj.id);
      }
    });
  }

  parseVector3(str) {
    if (!str) return null;
    return str.split(',').map(s => {
      const trimmed = s.trim();
      return isNaN(trimmed) ? trimmed : parseFloat(trimmed);
    });
  }
}

export class SVG3ThreeRenderer {
  constructor(sceneData, canvas) {
    this.sceneData = sceneData;
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animations = [];
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.rotationSpeed = 0.01;
  }

  async init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    const cameraData = this.sceneData.scenes.main.camera;
    this.camera = new THREE.PerspectiveCamera(
      cameraData.fov,
      this.canvas.width / this.canvas.height,
      cameraData.near,
      cameraData.far
    );
    this.camera.position.set(...cameraData.position);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, this.sceneData.scenes.main.ambientLight);
    this.scene.add(ambientLight);

    this.sceneData.scenes.main.lights.forEach(lightData => {
      let light;
      if (lightData.type === 'directional') {
        light = new THREE.DirectionalLight(lightData.color, lightData.intensity);
        light.position.set(...lightData.position);
        light.castShadow = true;
      } else if (lightData.type === 'point') {
        light = new THREE.PointLight(lightData.color, lightData.intensity);
        light.position.set(...lightData.position);
      }
      if (light) this.scene.add(light);
    });

    this.geometries = {};
    this.materials = {};

    Object.entries(this.sceneData.defs.geometries).forEach(([id, geoData]) => {
      this.geometries[id] = this.createGeometry(geoData);
    });

    Object.entries(this.sceneData.defs.materials).forEach(([id, matData]) => {
      this.materials[id] = this.createMaterial(matData);
    });

    this.objects = {};
    this.sceneData.scenes.main.objects.forEach(objData => {
      const obj = this.createObject(objData);
      if (obj) {
        this.objects[objData.id] = obj;
        this.scene.add(obj);
      }
    });

    this.setupMouseControls();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  createGeometry(geoData) {
    const { type, params } = geoData;
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(params.width, params.height, params.depth);
      case 'sphere':
        return new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments);
      case 'cylinder':
        return new THREE.CylinderGeometry(params.radiusTop, params.radiusBottom, params.height, params.radialSegments, params.heightSegments);
      case 'plane':
        return new THREE.PlaneGeometry(params.width, params.height, params.widthSegments, params.heightSegments);
      case 'torus':
        return new THREE.TorusGeometry(params.radius, params.tube, params.radialSegments, params.tubularSegments);
      default:
        console.warn('Unknown geometry type: ' + type);
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  createMaterial(matData) {
    const { type, params } = matData;
    switch (type) {
      case 'standard':
        return new THREE.MeshStandardMaterial(params);
      case 'phong':
        return new THREE.MeshPhongMaterial(params);
      case 'lambert':
        return new THREE.MeshLambertMaterial(params);
      case 'basic':
        return new THREE.MeshBasicMaterial(params);
      default:
        return new THREE.MeshStandardMaterial(params);
    }
  }

  createObject(objData) {
    if (objData.type === 'mesh') {
      const geometry = this.geometries[objData.geometry];
      const material = this.materials[objData.material];

      if (!geometry || !material) {
        console.warn('Missing geometry or material for mesh: ' + objData.id);
        return null;
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...objData.position);
      mesh.rotation.set(...objData.rotation.map(r => r * Math.PI / 180));
      mesh.scale.set(...objData.scale);

      if (objData.castShadow) mesh.castShadow = true;
      if (objData.receiveShadow) mesh.receiveShadow = true;

      return mesh;
    } else if (objData.type === 'group') {
      const group = new THREE.Group();
      group.position.set(...objData.position);
      group.rotation.set(...objData.rotation.map(r => r * Math.PI / 180));
      group.scale.set(...objData.scale);
      return group;
    }
    return null;
  }

  setupMouseControls() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      this.scene.rotation.y += deltaX * this.rotationSpeed;
      this.scene.rotation.x += deltaY * this.rotationSpeed;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isMouseDown = false;
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const currentTime = Date.now() * 0.001;

    this.sceneData.animations.forEach(anim => {
      const obj = this.objects[anim.targetId];
      if (!obj) return;

      const duration = this.parseDuration(anim.dur);
      const progress = (currentTime % duration) / duration;

      if (anim.attributeName === 'rotation') {
        const from = anim.from.map(r => r * Math.PI / 180);
        const to = anim.to.map(r => r * Math.PI / 180);
        const current = from.map((f, i) => f + (to[i] - f) * progress);
        obj.rotation.set(...current);
      } else if (anim.attributeName === 'position') {
        const current = anim.from.map((f, i) => f + (anim.to[i] - f) * progress);
        obj.position.set(...current);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  parseDuration(dur) {
    if (dur.endsWith('s')) {
      return parseFloat(dur.slice(0, -1));
    }
    return 1;
  }
}
`;

    // Execute the SVG3 implementation
    eval(SVG3_IMPLEMENTATION);

    // Parse and render
    const parser = new SVG3Parser();
    const sceneData = parser.parse(svg3Text);

    const renderer = new SVG3ThreeRenderer(sceneData, this.canvas);
    await renderer.init();

    this.renderer = renderer;
  }

  showLoading() {
    this.loadingDiv.style.display = 'block';
    this.errorDiv.style.display = 'none';
  }

  hideLoading() {
    this.loadingDiv.style.display = 'none';
  }

  showError(message) {
    this.loadingDiv.style.display = 'none';
    this.errorDiv.style.display = 'block';
    this.errorDiv.innerHTML = '<h3>Error Loading SVG3</h3><p>' + message + '</p>';
  }

  // Static method for easy loading
  static async loadIntoContainer(url, containerId) {
    const loader = new SVG3Loader(containerId);
    await loader.load(url);
    return loader;
  }
}

// Make it globally available
window.SVG3Loader = SVG3Loader;