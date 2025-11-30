/**
 * SVG3 Game Control System
 * Skeletal animation, puppet control, and real-time property manipulation
 * Perfect for game characters, interactive models, and dynamic scenes
 */

// ============================================================================
// 1. GAME CONTROLLER - High-level API for game engines
// ============================================================================

export class SVG3GameController {
  constructor(renderer) {
    this.renderer = renderer;
    this.meshes = renderer.meshes;
    this.scene = renderer.scene;
    this.bones = new Map();  // Skeleton hierarchy
    this.animationTargets = new Map();  // Named animation targets
    this.propertyBindings = new Map();  // Property -> mesh mappings
  }

  /**
   * Setup skeletal animation bones
   * Allows hierarchical control (parent affects children)
   */
  setupBones(boneDefinitions) {
    // boneDefinitions = [
    //   { id: 'torso', parent: null, position: [0,0,0] },
    //   { id: 'left-arm', parent: 'torso', position: [1,0,0] },
    //   { id: 'left-hand', parent: 'left-arm', position: [1,0,0] }
    // ]

    boneDefinitions.forEach(boneDef => {
      const mesh = this.meshes.get(boneDef.id);
      if (!mesh) {
        console.warn(`Bone mesh not found: ${boneDef.id}`);
        return;
      }

      this.bones.set(boneDef.id, {
        id: boneDef.id,
        mesh: mesh,
        parent: boneDef.parent,
        children: [],
        originalPosition: mesh.position.clone(),
        originalRotation: mesh.rotation.order === 'XYZ' 
          ? { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }
          : mesh.rotation.toArray(),
      });
    });

    // Build hierarchy
    this.bones.forEach((bone, id) => {
      if (bone.parent) {
        const parent = this.bones.get(bone.parent);
        if (parent) parent.children.push(id);
      }
    });
  }

  /**
   * Get bone by name for control
   */
  getBone(boneId) {
    return this.bones.get(boneId);
  }

  /**
   * Rotate a bone (body part)
   * @param boneId - Name of bone to rotate
   * @param rotation - [x, y, z] in radians or {x, y, z}
   * @param absolute - If true, sets absolute rotation. If false, adds to current
   */
  rotateBone(boneId, rotation, absolute = true) {
    const bone = this.bones.get(boneId);
    if (!bone) return;

    const rot = Array.isArray(rotation) ? rotation : [rotation.x || 0, rotation.y || 0, rotation.z || 0];

    if (absolute) {
      bone.mesh.rotation.set(...rot);
    } else {
      bone.mesh.rotation.x += rot[0];
      bone.mesh.rotation.y += rot[1];
      bone.mesh.rotation.z += rot[2];
    }
  }

  /**
   * Move a bone in space
   * @param boneId - Name of bone to move
   * @param position - [x, y, z] or {x, y, z}
   * @param absolute - If true, sets absolute position. If false, adds to current
   */
  moveBone(boneId, position, absolute = true) {
    const bone = this.bones.get(boneId);
    if (!bone) return;

    const pos = Array.isArray(position) ? position : [position.x || 0, position.y || 0, position.z || 0];

    if (absolute) {
      bone.mesh.position.set(...pos);
    } else {
      bone.mesh.position.x += pos[0];
      bone.mesh.position.y += pos[1];
      bone.mesh.position.z += pos[2];
    }
  }

  /**
   * Scale a bone
   */
  scaleBone(boneId, scale, absolute = true) {
    const bone = this.bones.get(boneId);
    if (!bone) return;

    const s = Array.isArray(scale) ? scale : [scale.x || 1, scale.y || 1, scale.z || 1];

    if (absolute) {
      bone.mesh.scale.set(...s);
    } else {
      bone.mesh.scale.x *= s[0];
      bone.mesh.scale.y *= s[1];
      bone.mesh.scale.z *= s[2];
    }
  }

  /**
   * Animate a bone over time
   */
  animateBone(boneId, property, from, to, duration) {
    const bone = this.bones.get(boneId);
    if (!bone) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      if (Array.isArray(from)) {
        const interpolated = from.map((f, i) => f + (to[i] - f) * progress);
        if (property === 'rotation') {
          bone.mesh.rotation.set(...interpolated);
        } else if (property === 'position') {
          bone.mesh.position.set(...interpolated);
        } else if (property === 'scale') {
          bone.mesh.scale.set(...interpolated);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Get all bones (for debugging or batch operations)
   */
  getAllBones() {
    return Array.from(this.bones.entries()).map(([id, bone]) => ({
      id,
      position: bone.mesh.position.toArray(),
      rotation: [bone.mesh.rotation.x, bone.mesh.rotation.y, bone.mesh.rotation.z],
      scale: bone.mesh.scale.toArray(),
    }));
  }

  /**
   * Reset bone to original state
   */
  resetBone(boneId) {
    const bone = this.bones.get(boneId);
    if (!bone) return;

    bone.mesh.position.copy(bone.originalPosition);
    if (Array.isArray(bone.originalRotation)) {
      bone.mesh.rotation.set(...bone.originalRotation);
    } else {
      bone.mesh.rotation.x = bone.originalRotation.x;
      bone.mesh.rotation.y = bone.originalRotation.y;
      bone.mesh.rotation.z = bone.originalRotation.z;
    }
    bone.mesh.scale.set(1, 1, 1);
  }

  /**
   * Reset all bones to original state
   */
  resetAll() {
    this.bones.forEach((bone, id) => this.resetBone(id));
  }
}

// ============================================================================
// 2. PROPERTY BINDING SYSTEM - Bind game properties to SVG3 elements
// ============================================================================

export class PropertyBinding {
  constructor(targetId, property) {
    this.targetId = targetId;
    this.property = property;  // 'position.x', 'rotation.y', 'scale', 'material.color'
    this.mesh = null;
    this.material = null;
    this.originalValue = null;
  }

  initialize(meshMap) {
    this.mesh = meshMap.get(this.targetId);
    if (!this.mesh) {
      console.warn(`Mesh not found for binding: ${this.targetId}`);
      return false;
    }

    // Store original value
    const value = this.getValue();
    this.originalValue = Array.isArray(value) ? [...value] : value;
    return true;
  }

  getValue() {
    const parts = this.property.split('.');
    let obj = this.mesh;

    for (const part of parts) {
      if (obj[part] === undefined) return null;
      obj = obj[part];
    }

    if (obj && obj.toArray) return obj.toArray();
    return obj;
  }

  setValue(value) {
    const parts = this.property.split('.');
    let obj = this.mesh;

    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }

    const lastPart = parts[parts.length - 1];
    const target = obj[lastPart];

    if (Array.isArray(value) && target && target.set) {
      target.set(...value);
    } else if (value && value.isColor) {
      target.copy(value);
    } else {
      obj[lastPart] = value;
    }
  }

  reset() {
    this.setValue(this.originalValue);
  }
}

// ============================================================================
// 3. INVERSE KINEMATICS (IK) SOLVER - Position limbs by target location
// ============================================================================

export class IKSolver {
  constructor(rootBoneId, endBoneId, bones) {
    this.rootBoneId = rootBoneId;
    this.endBoneId = endBoneId;
    this.bones = bones;
    this.chainLength = this.calculateChainLength();
    this.iterations = 5;  // FABRIK iterations
  }

  calculateChainLength() {
    let bone = this.bones.get(this.endBoneId);
    const chain = [];

    while (bone) {
      chain.unshift(bone.id);
      bone = this.bones.get(bone.parent);
      if (bone && bone.id === this.rootBoneId) {
        chain.unshift(this.rootBoneId);
        break;
      }
    }

    return chain;
  }

  /**
   * Solve IK - position end bone at target location
   * @param targetPosition - [x, y, z] where end bone should reach
   */
  solve(targetPosition, maxIterations = 5) {
    // Simplified FABRIK algorithm
    const chain = [];
    let bone = this.bones.get(this.endBoneId);

    while (bone) {
      chain.unshift(bone.mesh);
      bone = this.bones.get(bone.parent);
      if (!bone || bone.id === this.rootBoneId) break;
    }

    if (chain.length < 2) return;

    const target = new (require('three')).Vector3(...targetPosition);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Forward pass
      for (let i = chain.length - 1; i > 0; i--) {
        const current = chain[i];
        const parent = chain[i - 1];

        const direction = new (require('three')).Vector3()
          .subVectors(current.position, parent.position)
          .normalize();

        const distance = parent.position.distanceTo(current.position);
        current.position.copy(parent.position).addScaledVector(direction, distance);
      }

      // Backward pass
      chain[chain.length - 1].position.copy(target);
      for (let i = chain.length - 2; i >= 0; i--) {
        const current = chain[i];
        const child = chain[i + 1];

        const direction = new (require('three')).Vector3()
          .subVectors(current.position, child.position)
          .normalize();

        const distance = current.position.distanceTo(child.position);
        current.position.copy(child.position).addScaledVector(direction, distance);
      }
    }
  }
}

// ============================================================================
// 4. ANIMATION STATE MACHINE - For character states (idle, walk, run, jump)
// ============================================================================

export class AnimationStateMachine {
  constructor(gameController) {
    this.gameController = gameController;
    this.states = new Map();
    this.currentState = null;
    this.transitions = new Map();
  }

  /**
   * Add animation state
   */
  addState(stateName, animationCallback) {
    // animationCallback(gameController, deltaTime, params)
    this.states.set(stateName, {
      name: stateName,
      callback: animationCallback,
      isActive: false,
    });
  }

  /**
   * Add transition between states
   */
  addTransition(fromState, toState, condition) {
    // condition(gameController, params) -> boolean
    const key = `${fromState}->${toState}`;
    this.transitions.set(key, { from: fromState, to: toState, condition });
  }

  /**
   * Transition to state
   */
  transitionTo(stateName) {
    if (this.currentState) {
      const state = this.states.get(this.currentState);
      if (state) state.isActive = false;
    }

    this.currentState = stateName;
    const state = this.states.get(stateName);
    if (state) state.isActive = true;
  }

  /**
   * Update state machine
   */
  update(deltaTime, params = {}) {
    // Check transitions
    if (this.currentState) {
      this.transitions.forEach((trans, key) => {
        if (trans.from === this.currentState) {
          if (trans.condition(this.gameController, params)) {
            this.transitionTo(trans.to);
          }
        }
      });
    }

    // Execute current state
    if (this.currentState) {
      const state = this.states.get(this.currentState);
      if (state && state.callback) {
        state.callback(this.gameController, deltaTime, params);
      }
    }
  }
}

// ============================================================================
// 5. PUPPET CONTROL INTERFACE - Simplified API for common operations
// ============================================================================

export class PuppetControl {
  constructor(gameController, boneId) {
    this.gameController = gameController;
    this.boneId = boneId;
    this.bone = gameController.getBone(boneId);
  }

  // Convenience methods
  rotate(x, y, z) {
    this.gameController.rotateBone(this.boneId, [x, y, z], true);
    return this;
  }

  rotateX(angle) {
    this.gameController.rotateBone(this.boneId, [angle, 0, 0], false);
    return this;
  }

  rotateY(angle) {
    this.gameController.rotateBone(this.boneId, [0, angle, 0], false);
    return this;
  }

  rotateZ(angle) {
    this.gameController.rotateBone(this.boneId, [0, 0, angle], false);
    return this;
  }

  move(x, y, z) {
    this.gameController.moveBone(this.boneId, [x, y, z], true);
    return this;
  }

  moveX(distance) {
    this.gameController.moveBone(this.boneId, [distance, 0, 0], false);
    return this;
  }

  moveY(distance) {
    this.gameController.moveBone(this.boneId, [0, distance, 0], false);
    return this;
  }

  moveZ(distance) {
    this.gameController.moveBone(this.boneId, [0, 0, distance], false);
    return this;
  }

  scale(x, y, z) {
    this.gameController.scaleBone(this.boneId, [x, y, z], true);
    return this;
  }

  animate(property, from, to, duration) {
    this.gameController.animateBone(this.boneId, property, from, to, duration);
    return this;
  }

  reset() {
    this.gameController.resetBone(this.boneId);
    return this;
  }

  getPosition() {
    return this.bone.mesh.position.toArray();
  }

  getRotation() {
    return [this.bone.mesh.rotation.x, this.bone.mesh.rotation.y, this.bone.mesh.rotation.z];
  }

  getScale() {
    return this.bone.mesh.scale.toArray();
  }
}

// ============================================================================
// 6. GAME CHARACTER - Complete character with skeletal control
// ============================================================================

export class GameCharacter {
  constructor(name, gameController, boneDefinitions) {
    this.name = name;
    this.gameController = gameController;
    this.puppets = new Map();  // PuppetControl instances
    this.stateMachine = new AnimationStateMachine(gameController);
    this.ikSolvers = new Map();

    // Setup bones
    gameController.setupBones(boneDefinitions);

    // Create puppet controls for each bone
    boneDefinitions.forEach(boneDef => {
      this.puppets.set(boneDef.id, new PuppetControl(gameController, boneDef.id));
    });
  }

  /**
   * Get puppet control for a body part
   */
  getPuppet(boneId) {
    return this.puppets.get(boneId);
  }

  /**
   * Setup inverse kinematics for a limb
   */
  setupIK(limbName, rootBoneId, endBoneId) {
    const ikSolver = new IKSolver(rootBoneId, endBoneId, this.gameController.bones);
    this.ikSolvers.set(limbName, ikSolver);
    return ikSolver;
  }

  /**
   * Move limb to target position using IK
   */
  moveLimbToTarget(limbName, targetPosition) {
    const ikSolver = this.ikSolvers.get(limbName);
    if (ikSolver) {
      ikSolver.solve(targetPosition);
    }
  }

  /**
   * Perform attack animation
   */
  attack() {
    const rightArm = this.puppets.get('right-arm');
    if (rightArm) {
      rightArm.rotateZ(Math.PI / 4).animate('rotation', [0, 0, 0], [0, 0, Math.PI / 3], 0.3);
    }
  }

  /**
   * Wave animation
   */
  wave() {
    const leftArm = this.puppets.get('left-arm');
    if (leftArm) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          leftArm.rotateZ(Math.PI / 8);
        }, i * 200);
      }
    }
  }

  /**
   * Walk animation (side to side leg movement)
   */
  walk(duration = 2) {
    const leftLeg = this.puppets.get('left-leg');
    const rightLeg = this.puppets.get('right-leg');

    if (leftLeg && rightLeg) {
      leftLeg.animate('rotation', [0, 0, 0], [-0.3, 0, 0], duration / 2);
      rightLeg.animate('rotation', [-0.3, 0, 0], [0, 0, 0], duration / 2);
    }
  }

  /**
   * Jump animation
   */
  jump(height = 2, duration = 0.6) {
    const torso = this.puppets.get('torso');
    if (torso) {
      torso.animate('position', [0, 0, 0], [0, height, 0], duration / 2);
      setTimeout(() => {
        torso.animate('position', [0, height, 0], [0, 0, 0], duration / 2);
      }, (duration / 2) * 1000);
    }
  }

  /**
   * Get all bone states (for saving/loading)
   */
  getState() {
    return this.gameController.getAllBones();
  }

  /**
   * Restore bone states
   */
  setState(boneStates) {
    boneStates.forEach(state => {
      const puppet = this.puppets.get(state.id);
      if (puppet) {
        puppet.move(...state.position);
        puppet.rotate(...state.rotation);
        puppet.scale(...state.scale);
      }
    });
  }
}

// ============================================================================
// 7. INTEGRATION WITH SVG3RENDERER
// ============================================================================

export function enableGameControls(svg3Renderer) {
  const gameController = new SVG3GameController(svg3Renderer);
  svg3Renderer.gameController = gameController;
  return gameController;
}

export default {
  SVG3GameController,
  PropertyBinding,
  IKSolver,
  AnimationStateMachine,
  PuppetControl,
  GameCharacter,
  enableGameControls,
};
